#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
KDST RAG 모듈 - ReportAgent에서 사용
이 모듈을 import하여 KDST 문제에 대한 RAG 검색을 수행할 수 있습니다.
"""

import json
import sys
import os

# UTF-8 인코딩 설정
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

import numpy as np
from sentence_transformers import SentenceTransformer
import sqlite3
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime

# 모델 로드 (한 번만 로드)
_model = None

def get_model():
    """Sentence Transformer 모델을 싱글톤으로 반환"""
    global _model
    if _model is None:
        _model = SentenceTransformer('jhgan/ko-sroberta-multitask')
    return _model

def get_embedding(text):
    """텍스트를 벡터로 변환"""
    try:
        model = get_model()
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"임베딩 생성 실패: {e}", file=sys.stderr)
        return None

def load_diary_embeddings():
    """벡터 DB에서 일기 임베딩들을 로드"""
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'my_local_qdrant_db', 'diary_embeddings.db')
        
        if not os.path.exists(db_path):
            return None, None
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 모든 일기 임베딩 로드
        cursor.execute('SELECT diary_id, text, embedding, date FROM diary_embeddings')
        rows = cursor.fetchall()
        
        if not rows:
            return None, None
        
        diary_texts = []
        diary_embeddings = []
        diary_info = []
        
        for row in rows:
            diary_id, text, embedding_blob, date = row
            embedding = json.loads(embedding_blob)
            
            diary_texts.append(text)
            diary_embeddings.append(embedding)
            diary_info.append({
                'id': diary_id,
                'text': text,
                'date': date
            })
        
        conn.close()
        return diary_embeddings, diary_info
        
    except Exception as e:
        print(f"일기 임베딩 로드 실패: {e}", file=sys.stderr)
        return None, None

def find_similar_diaries(query, diary_embeddings, diary_info, top_k=3):
    """쿼리와 가장 유사한 일기들을 찾기"""
    try:
        # 쿼리 임베딩 생성
        query_embedding = get_embedding(query)
        if query_embedding is None:
            return []
        
        # 코사인 유사도 계산
        similarities = []
        for i, diary_embedding in enumerate(diary_embeddings):
            similarity = cosine_similarity([query_embedding], [diary_embedding])[0][0]
            similarities.append((similarity, i))
        
        # 유사도 순으로 정렬 (높은 순)
        similarities.sort(reverse=True)
        
        # 상위 k개 결과 반환
        top_results = []
        for similarity, idx in similarities[:top_k]:
            diary = diary_info[idx]
            top_results.append({
                'diary_id': diary['id'],
                'text': diary['text'],
                'date': diary['date'],
                'similarity': float(similarity)
            })
        
        return top_results
        
    except Exception as e:
        print(f"유사 일기 검색 실패: {e}", file=sys.stderr)
        return []

def process_kdst_questions(questions):
    """KDST 문제들을 처리하여 RAG 결과 생성"""
    try:
        # 일기 임베딩 로드
        diary_embeddings, diary_info = load_diary_embeddings()
        
        if diary_embeddings is None:
            return {"success": False, "message": "일기 임베딩을 로드할 수 없습니다."}
        
        results = []
        
        for question in questions:
            # 유사한 일기 검색
            similar_diaries = find_similar_diaries(question, diary_embeddings, diary_info, top_k=3)
            
            # 결과 저장
            result = {
                "문제": question,
                "일기": similar_diaries
            }
            results.append(result)
        
        return {
            "success": True,
            "message": "KDST 문제 RAG 검색 완료",
            "results": results
        }
        
    except Exception as e:
        return {"success": False, "message": f"KDST 문제 처리 실패: {str(e)}"}

def get_kdst_rag_result(questions):
    """KDST 문제들에 대한 RAG 결과를 반환 (ReportAgent용)"""
    return process_kdst_questions(questions)

def get_single_kdst_rag_result(question):
    """단일 KDST 문제에 대한 RAG 결과를 반환 (ReportAgent용)"""
    return process_kdst_questions([question])

def format_kdst_result_for_report(rag_result):
    """RAG 결과를 보고서 작성용으로 포맷팅"""
    if not rag_result.get("success"):
        return None
    
    formatted_result = {
        "kdst_analysis": [],
        "total_questions": len(rag_result["results"]),
        "analysis_date": str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    }
    
    for item in rag_result["results"]:
        question = item["문제"]
        diaries = item["일기"]
        
        analysis_item = {
            "question": question,
            "related_diaries": [],
            "top_similarity": 0.0,
            "has_related_content": len(diaries) > 0
        }
        
        if diaries:
            analysis_item["top_similarity"] = diaries[0]["similarity"]
            
            for diary in diaries:
                diary_info = {
                    "date": diary["date"],
                    "content": diary["text"],
                    "similarity": diary["similarity"],
                    "diary_id": diary["diary_id"]
                }
                analysis_item["related_diaries"].append(diary_info)
        
        formatted_result["kdst_analysis"].append(analysis_item)
    
    return formatted_result

def get_kdst_report_context(questions):
    """ReportAgent에서 사용할 수 있는 KDST 보고서 컨텍스트 생성"""
    try:
        # RAG 검색 수행
        rag_result = get_kdst_rag_result(questions)
        
        if not rag_result.get("success"):
            return {
                "success": False,
                "message": "RAG 검색 실패",
                "context": None
            }
        
        # 보고서 작성용 컨텍스트 생성
        context = {
            "kdst_questions": questions,
            "rag_results": rag_result["results"],
            "analysis_summary": {
                "total_questions": len(questions),
                "questions_with_related_content": sum(1 for item in rag_result["results"] if item["일기"]),
                "average_top_similarity": np.mean([
                    item["일기"][0]["similarity"] if item["일기"] else 0 
                    for item in rag_result["results"]
                ])
            }
        }
        
        return {
            "success": True,
            "message": "KDST 보고서 컨텍스트 생성 완료",
            "context": context
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"컨텍스트 생성 실패: {str(e)}",
            "context": None
        }

# 사용 예시 및 CLI 인터페이스
if __name__ == "__main__":
    try:
        # stdin에서 입력 받기 (Node.js에서 호출될 때)
        if not sys.stdin.isatty():
            input_data = sys.stdin.read().strip()
            if input_data:
                # JSON 파싱
                data = json.loads(input_data)
                questions = data.get('questions', [])
                
                if questions:
                    # RAG 검색 수행
                    result = get_kdst_rag_result(questions)
                    
                    # 결과를 JSON으로 출력 (Node.js에서 받을 수 있도록)
                    output = json.dumps(result, ensure_ascii=False, indent=None)
                    print(output, flush=True)
                else:
                    error_output = json.dumps({
                        "success": False,
                        "message": "질문이 제공되지 않았습니다."
                    }, ensure_ascii=False)
                    print(error_output, flush=True)
            else:
                error_output = json.dumps({
                    "success": False,
                    "message": "입력 데이터가 없습니다."
                }, ensure_ascii=False)
                print(error_output, flush=True)
        else:
            # 터미널에서 직접 실행될 때 (테스트)
            test_questions = [
                "엎드린 자세에서 뒤집는다.",
                "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
                "누워 있을 때 자기 발을 잡고 논다"
            ]
            
            print("KDST RAG 모듈 테스트")
            print("=" * 50)
            
            # RAG 검색
            result = get_kdst_rag_result(test_questions)
            print(f"RAG 검색 성공: {result['success']}")
            
            # 보고서 컨텍스트 생성
            context = get_kdst_report_context(test_questions)
            print(f"컨텍스트 생성 성공: {context['success']}")
            
            if context['success']:
                print(f"총 문제 수: {context['context']['analysis_summary']['total_questions']}")
                print(f"관련 일기가 있는 문제 수: {context['context']['analysis_summary']['questions_with_related_content']}")
                print(f"평균 최고 유사도: {context['context']['analysis_summary']['average_top_similarity']:.4f}")
                
    except json.JSONDecodeError as e:
        error_output = json.dumps({
            "success": False,
            "message": f"JSON 파싱 오류: {str(e)}"
        }, ensure_ascii=False)
        print(error_output, file=sys.stderr, flush=True)
        sys.exit(1)
    except Exception as e:
        error_output = json.dumps({
            "success": False,
            "message": f"예상치 못한 오류: {str(e)}"
        }, ensure_ascii=False)
        print(error_output, file=sys.stderr, flush=True)
        sys.exit(1)

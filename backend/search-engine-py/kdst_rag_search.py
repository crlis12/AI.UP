#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import numpy as np
from sentence_transformers import SentenceTransformer
import sqlite3
import os
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime

# 모델 로드
model = SentenceTransformer('jhgan/ko-sroberta-multitask')

def get_embedding(text):
    """텍스트를 벡터로 변환"""
    try:
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
        
        print(f"총 {len(diary_embeddings)}개의 일기 임베딩을 로드했습니다.")
        print()
        
        results = []
        
        for i, question in enumerate(questions, 1):
            print(f"문제 {i}: {question}")
            print("-" * 50)
            
            # 유사한 일기 검색
            similar_diaries = find_similar_diaries(question, diary_embeddings, diary_info, top_k=3)
            
            if similar_diaries:
                print(f"상위 3개 유사 일기:")
                for j, diary in enumerate(similar_diaries, 1):
                    print(f"  {j}등: 유사도 {diary['similarity']:.4f}")
                    print(f"     날짜: {diary['date']}")
                    print(f"     내용: {diary['text'][:100]}...")
                    print()
            else:
                print("유사한 일기를 찾을 수 없습니다.")
                print()
            
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

def main():
    """메인 함수 - 테스트용"""
    try:
        # 테스트용 KDST 문제들
        kdst_questions = [
            "엎드린 자세에서 뒤집는다.",
            "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
            "누워 있을 때 자기 발을 잡고 논다"
        ]
        
        print("KDST 문제에 대한 RAG 기반 일기 검색을 시작합니다...")
        print("=" * 60)
        print()
        
        result = process_kdst_questions(kdst_questions)
        
        if result["success"]:
            print("=" * 60)
            print("최종 결과:")
            print("=" * 60)
            
            for i, item in enumerate(result["results"], 1):
                print(f"문제 {i}: {item['문제']}")
                print("일기:")
                
                if item['일기']:
                    for j, diary in enumerate(item['일기'], 1):
                        print(f"  유사도 {j}등: {diary['text'][:80]}...")
                else:
                    print("  관련 일기를 찾을 수 없습니다.")
                print()
        else:
            print(f"오류: {result['message']}")
        
        # JSON 결과도 출력
        print("JSON 결과:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(json.dumps({"success": False, "message": f"예상치 못한 오류: {str(e)}"}))

# ReportAgent에서 사용할 수 있는 함수들
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

if __name__ == "__main__":
    main()

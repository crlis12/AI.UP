#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import os
from datetime import datetime
from kdst_rag_module import get_kdst_rag_result

# UTF-8 인코딩 설정
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def save_kdst_rag_to_json(questions, output_filename=None):
    """KDST RAG 검색 결과를 JSON 파일로 저장"""
    try:
        # 출력 파일명 생성
        if not output_filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"kdst_rag_results_{timestamp}.json"
        
        output_path = os.path.join(os.path.dirname(__file__), output_filename)
        
        print(f"=== KDST RAG 검색 결과 JSON 저장 ===")
        print(f"질문 수: {len(questions)}개")
        print(f"출력 파일: {output_path}")
        print()
        
        # RAG 검색 수행
        print("RAG 검색 중...")
        rag_result = get_kdst_rag_result(questions)
        
        if not rag_result.get("success"):
            print(f"❌ RAG 검색 실패: {rag_result.get('message', 'Unknown error')}")
            return False
        
        # 결과 포맷팅
        formatted_result = {
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "total_questions": len(questions),
                "search_success": rag_result.get("success", False),
                "message": rag_result.get("message", "")
            },
            "questions": [],
            "summary": {
                "questions_with_results": 0,
                "total_diary_matches": 0,
                "average_top_similarity": 0.0
            }
        }
        
        # 각 질문별 결과 처리
        total_similarity = 0
        questions_with_results = 0
        total_diary_matches = 0
        
        for i, result in enumerate(rag_result.get("results", [])):
            question_text = result.get("문제", f"질문 {i+1}")
            diaries = result.get("일기", [])
            
            question_data = {
                "question_id": i + 1,
                "question_text": question_text,
                "related_diaries_count": len(diaries),
                "related_diaries": []
            }
            
            if diaries:
                questions_with_results += 1
                total_diary_matches += len(diaries)
                
                # 가장 높은 유사도 추가
                top_similarity = max([d.get("similarity", 0) for d in diaries]) if diaries else 0
                total_similarity += top_similarity
                question_data["top_similarity"] = top_similarity
                
                # 각 일기 정보 추가
                for j, diary in enumerate(diaries):
                    diary_data = {
                        "rank": j + 1,
                        "diary_id": diary.get("diary_id", "N/A"),
                        "date": diary.get("date", "N/A"),
                        "similarity_score": diary.get("similarity", 0),
                        "similarity_percentage": round(diary.get("similarity", 0) * 100, 2),
                        "content": diary.get("text", ""),
                        "content_preview": diary.get("text", "")[:100] + "..." if len(diary.get("text", "")) > 100 else diary.get("text", "")
                    }
                    question_data["related_diaries"].append(diary_data)
            else:
                question_data["top_similarity"] = 0.0
                question_data["message"] = "관련 일기를 찾을 수 없습니다."
            
            formatted_result["questions"].append(question_data)
        
        # 요약 정보 계산
        formatted_result["summary"]["questions_with_results"] = questions_with_results
        formatted_result["summary"]["total_diary_matches"] = total_diary_matches
        formatted_result["summary"]["average_top_similarity"] = round(
            total_similarity / len(questions) if questions else 0, 4
        )
        
        # JSON 파일로 저장
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(formatted_result, f, ensure_ascii=False, indent=2)
        
        print("✅ JSON 파일 저장 완료!")
        print(f"📊 요약:")
        print(f"   - 총 질문: {formatted_result['metadata']['total_questions']}개")
        print(f"   - 결과가 있는 질문: {formatted_result['summary']['questions_with_results']}개")
        print(f"   - 총 일기 매치: {formatted_result['summary']['total_diary_matches']}개")
        print(f"   - 평균 최고 유사도: {formatted_result['summary']['average_top_similarity']}")
        print(f"📁 저장 위치: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ JSON 저장 실패: {str(e)}")
        return False

def main():
    """메인 함수"""
    try:
        # 기본 KDST 질문들 (샘플)
        sample_questions = [
            "엎드린 자세에서 뒤집는다.",
            "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
            "누워 있을 때 자기 발을 잡고 논다",
            "앉은 자세에서 균형을 잡는다",
            "배밀이를 한다",
            "네발기기를 한다",
            "잡고 서 있는다",
            "혼자 걷는다",
            "계단을 기어 올라간다",
            "공을 던진다"
        ]
        
        # stdin에서 입력 받기 (Node.js에서 호출될 때)
        if not sys.stdin.isatty():
            input_data = sys.stdin.read().strip()
            if input_data:
                try:
                    data = json.loads(input_data)
                    questions = data.get('questions', sample_questions)
                    output_filename = data.get('output_filename', None)
                    
                    success = save_kdst_rag_to_json(questions, output_filename)
                    
                    # 결과를 JSON으로 출력 (Node.js에서 받을 수 있도록)
                    result = {
                        "success": success,
                        "message": "JSON 파일 저장 완료" if success else "JSON 파일 저장 실패",
                        "output_filename": output_filename or f"kdst_rag_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                    }
                    print(json.dumps(result, ensure_ascii=False))
                    
                except json.JSONDecodeError as e:
                    error_result = {
                        "success": False,
                        "message": f"JSON 파싱 오류: {str(e)}"
                    }
                    print(json.dumps(error_result, ensure_ascii=False))
            else:
                # 기본 샘플 질문으로 실행
                save_kdst_rag_to_json(sample_questions)
        else:
            # 터미널에서 직접 실행될 때
            print("샘플 KDST 질문들로 RAG 검색 결과를 JSON 파일로 저장합니다...")
            save_kdst_rag_to_json(sample_questions)
            
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {str(e)}")

if __name__ == "__main__":
    main()

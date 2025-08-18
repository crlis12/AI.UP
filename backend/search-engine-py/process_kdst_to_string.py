#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import os
from kdst_rag_module import get_kdst_rag_result

# UTF-8 인코딩 설정
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def process_kdst_rag_to_string(questions, debug=False):
    """KDST RAG 검색 결과를 문자열로 정제하여 이어붙이기"""
    try:
        if debug:
            print("=== KDST RAG → 문자열 변환 시작 ===", file=sys.stderr)
            print(f"질문 수: {len(questions)}개", file=sys.stderr)
            print("RAG 검색 중...", file=sys.stderr)
        
        # RAG 검색 수행
        rag_result = get_kdst_rag_result(questions)
        
        if not rag_result.get("success"):
            return {
                "success": False,
                "message": f"RAG 검색 실패: {rag_result.get('message', 'Unknown error')}",
                "diary_string": ""
            }
        
        # 모든 일기 데이터를 수집하고 중복 제거
        all_diaries = {}  # diary_id를 키로 사용하여 중복 제거
        
        for result in rag_result.get("results", []):
            question_text = result.get("문제", "")
            diaries = result.get("일기", [])
            
            if debug:
                print(f"📝 질문: {question_text}", file=sys.stderr)
                print(f"   관련 일기: {len(diaries)}개", file=sys.stderr)
            
            for diary in diaries:
                diary_id = diary.get("diary_id")
                if diary_id not in all_diaries:
                    all_diaries[diary_id] = {
                        "date": diary.get("date", ""),
                        "content": diary.get("text", ""),
                        "similarity": diary.get("similarity", 0)
                    }
        
        # 날짜순으로 정렬
        sorted_diaries = sorted(
            all_diaries.values(), 
            key=lambda x: x["date"] if x["date"] else "0000-00-00"
        )
        
        if debug:
            print(f"\n📊 수집된 고유 일기: {len(sorted_diaries)}개", file=sys.stderr)
        
        # 문자열로 변환 및 이어붙이기
        diary_strings = []
        
        for diary in sorted_diaries:
            date = diary["date"]
            content = diary["content"]
            
            # "YYYY-MM-DD, 내용" 형식으로 변환
            diary_string = f"{date}, {content}"
            diary_strings.append(diary_string)
            
            if debug:
                print(f"✅ {date}: {content[:50]}...", file=sys.stderr)
        
        # 모든 일기를 \n으로 이어붙이기
        final_diary_string = "\n".join(diary_strings)
        
        if debug:
            print(f"\n🎯 최종 결과:", file=sys.stderr)
            print(f"   - 총 일기 수: {len(diary_strings)}개", file=sys.stderr)
            print(f"   - 전체 문자열 길이: {len(final_diary_string)}자", file=sys.stderr)
            print(f"   - 미리보기 (처음 200자):", file=sys.stderr)
            print(f"     {final_diary_string[:200]}...", file=sys.stderr)
        
        return {
            "success": True,
            "message": "KDST RAG 결과를 문자열로 변환 완료",
            "diary_string": final_diary_string,
            "total_diaries": len(diary_strings),
            "string_length": len(final_diary_string),
            "preview": final_diary_string[:200] + "..." if len(final_diary_string) > 200 else final_diary_string
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"문자열 변환 실패: {str(e)}",
            "diary_string": ""
        }

def main():
    """메인 함수"""
    try:
        # stdin에서 입력 받기 (Node.js에서 호출될 때)
        if not sys.stdin.isatty():
            input_data = sys.stdin.read().strip()
            if input_data:
                try:
                    data = json.loads(input_data)
                    questions = data.get('questions', [])
                    
                    if not questions:
                        result = {
                            "success": False,
                            "message": "질문이 제공되지 않았습니다.",
                            "diary_string": ""
                        }
                    else:
                        result = process_kdst_rag_to_string(questions, debug=False)  # Node.js에서 호출 시 디버그 비활성화
                    
                    # 결과를 JSON으로 출력 (Node.js에서 받을 수 있도록)
                    print(json.dumps(result, ensure_ascii=False))
                    
                except json.JSONDecodeError as e:
                    error_result = {
                        "success": False,
                        "message": f"JSON 파싱 오류: {str(e)}",
                        "diary_string": ""
                    }
                    print(json.dumps(error_result, ensure_ascii=False))
            else:
                error_result = {
                    "success": False,
                    "message": "입력 데이터가 없습니다.",
                    "diary_string": ""
                }
                print(json.dumps(error_result, ensure_ascii=False))
        else:
            # 터미널에서 직접 실행될 때 (테스트)
            test_questions = [
                "엎드린 자세에서 뒤집는다.",
                "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
                "누워 있을 때 자기 발을 잡고 논다"
            ]
            
            print("테스트 질문들로 KDST RAG → 문자열 변환을 실행합니다...", file=sys.stderr)
            result = process_kdst_rag_to_string(test_questions, debug=True)  # 터미널에서 실행 시 디버그 활성화
            
            print("\n=== 최종 결과 ===", file=sys.stderr)
            print(f"성공: {result['success']}", file=sys.stderr)
            print(f"메시지: {result['message']}", file=sys.stderr)
            if result['success']:
                print(f"총 일기 수: {result['total_diaries']}", file=sys.stderr)
                print(f"문자열 길이: {result['string_length']}", file=sys.stderr)
                print(f"\n📄 생성된 문자열:", file=sys.stderr)
                print(result['diary_string'], file=sys.stderr)
            
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {str(e)}", file=sys.stderr)

if __name__ == "__main__":
    main()

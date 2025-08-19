#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import sqlite3
import os

# UTF-8 인코딩 설정 (Windows 환경 대응)
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())
    # stdin도 UTF-8로 설정
    sys.stdin = codecs.getreader('utf-8')(sys.stdin.detach())

def delete_diary_embedding(diary_id):
    """벡터 DB에서 일기 임베딩을 삭제"""
    try:
        # SQLite DB에서 삭제
        db_path = os.path.join(os.path.dirname(__file__), 'my_local_qdrant_db', 'diary_embeddings.db')
        
        if not os.path.exists(db_path):
            return {"success": False, "message": "벡터 DB가 존재하지 않습니다."}
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 기존 데이터 확인
        cursor.execute('SELECT id FROM diary_embeddings WHERE diary_id = ?', (diary_id,))
        existing = cursor.fetchone()
        
        if not existing:
            conn.close()
            return {"success": False, "message": f"일기 ID {diary_id}에 대한 벡터 임베딩을 찾을 수 없습니다."}
        
        # 삭제 실행
        cursor.execute('DELETE FROM diary_embeddings WHERE diary_id = ?', (diary_id,))
        deleted_rows = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "message": f"벡터 임베딩 삭제 완료",
            "diary_id": diary_id,
            "deleted_rows": deleted_rows
        }
        
    except Exception as e:
        return {"success": False, "message": f"벡터 DB 삭제 실패: {str(e)}"}

def main():
    """메인 함수"""
    try:
        # stdin에서 JSON 데이터 읽기
        input_data = sys.stdin.read().strip()
        if not input_data:
            print(json.dumps({"success": False, "message": "입력 데이터가 없습니다."}))
            return
        
        # JSON 파싱
        data = json.loads(input_data)
        diary_id = data.get('diary_id')
        
        if not diary_id:
            print(json.dumps({"success": False, "message": "diary_id가 제공되지 않았습니다."}))
            return
        
        # 벡터 DB에서 삭제
        result = delete_diary_embedding(diary_id)
        
        # 결과 출력
        print(json.dumps(result, ensure_ascii=False))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "message": f"JSON 파싱 실패: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"success": False, "message": f"예상치 못한 오류: {str(e)}"}))

if __name__ == "__main__":
    main()

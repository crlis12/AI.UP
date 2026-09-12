#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import numpy as np
from sentence_transformers import SentenceTransformer
import sqlite3
import os

# UTF-8 인코딩 설정 (Windows 환경 대응)
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())
    # stdin도 UTF-8로 설정
    sys.stdin = codecs.getreader('utf-8')(sys.stdin.detach())

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

def upsert_diary(diary_data):
    """일기 데이터를 벡터 DB에 저장/업데이트"""
    try:
        # 텍스트 준비 (날짜 + 제목 + 내용 + [비공개 캡션])
        date_str = diary_data.get('date', '')
        title = diary_data.get('title', '')
        content = diary_data.get('content', '')
        captions = diary_data.get('captions') or []
        if isinstance(captions, str):
            # 잘못 전달된 경우 문자열을 리스트로 처리
            captions = [captions]
        if not isinstance(captions, list):
            captions = []
        
        if date_str:
            base_text = f"{date_str} : {content}".strip()
        else:
            base_text = f"{title} {content}".strip()
        captions_text = " ".join([str(c).strip() for c in captions if str(c).strip()])
        text = base_text if not captions_text else f"{base_text} {captions_text}".strip()
        if not text:
            return {"success": False, "message": "텍스트가 비어있습니다."}
        
        # 벡터 임베딩 생성
        embedding = get_embedding(text)
        if embedding is None:
            return {"success": False, "message": "임베딩 생성 실패"}
        
        # SQLite DB에 저장 (간단한 벡터 저장소)
        db_path = os.path.join(os.path.dirname(__file__), 'my_local_qdrant_db', 'diary_embeddings.db')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 테이블 생성
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS diary_embeddings (
                id INTEGER PRIMARY KEY,
                diary_id INTEGER UNIQUE,
                text TEXT,
                embedding BLOB,
                date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 기존 데이터 확인
        cursor.execute('SELECT id FROM diary_embeddings WHERE diary_id = ?', (diary_data['id'],))
        existing = cursor.fetchone()
        
        if existing:
            # 업데이트
            cursor.execute('''
                UPDATE diary_embeddings 
                SET text = ?, embedding = ?, date = ?, created_at = CURRENT_TIMESTAMP
                WHERE diary_id = ?
            ''', (text, json.dumps(embedding), diary_data.get('date', ''), diary_data['id']))
            action = "updated"
        else:
            # 새로 생성
            cursor.execute('''
                INSERT INTO diary_embeddings (diary_id, text, embedding, date)
                VALUES (?, ?, ?, ?)
            ''', (diary_data['id'], text, json.dumps(embedding), diary_data.get('date', '')))
            action = "created"
        
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "message": f"벡터 임베딩 {action} 완료",
            "diary_id": diary_data['id'],
            "text_length": len(text),
            "embedding_dim": len(embedding)
        }
        
    except Exception as e:
        return {"success": False, "message": f"벡터 DB 저장 실패: {str(e)}"}

def main():
    """메인 함수"""
    try:
        # stdin에서 JSON 데이터 읽기
        input_data = sys.stdin.read().strip()
        if not input_data:
            print(json.dumps({"success": False, "message": "입력 데이터가 없습니다."}))
            return
        
        # JSON 파싱
        diary_data = json.loads(input_data)
        
        # 벡터 DB에 저장/업데이트
        result = upsert_diary(diary_data)
        
        # 결과 출력
        print(json.dumps(result, ensure_ascii=False))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "message": f"JSON 파싱 실패: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"success": False, "message": f"예상치 못한 오류: {str(e)}"}))

if __name__ == "__main__":
    main()

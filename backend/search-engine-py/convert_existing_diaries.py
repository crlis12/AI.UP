#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import numpy as np
from sentence_transformers import SentenceTransformer
import sqlite3
import os
import mysql.connector
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv('../.env.local')

# 모델 로드
model = SentenceTransformer('jhgan/ko-sroberta-multitask')

def get_mysql_connection():
    """MySQL 연결"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'youhyun'),
            password=os.getenv('DB_PASSWORD', '64808'),
            database=os.getenv('DB_NAME', 'little_todakDB')
        )
        return connection
    except Exception as e:
        print(f"MySQL 연결 실패: {e}", file=sys.stderr)
        return None

def get_embedding(text):
    """텍스트를 벡터로 변환"""
    try:
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"임베딩 생성 실패: {e}", file=sys.stderr)
        return None

def convert_existing_diaries():
    """기존 일기들을 벡터 임베딩으로 변환"""
    try:
        # MySQL 연결
        mysql_conn = get_mysql_connection()
        if not mysql_conn:
            return {"success": False, "message": "MySQL 연결 실패"}
        
        cursor = mysql_conn.cursor(dictionary=True)
        
        # 기존 일기들 조회
        cursor.execute('SELECT id, user_id, title, content, mood, created_at FROM parent_diaries ORDER BY id')
        diaries = cursor.fetchall()
        
        if not diaries:
            return {"success": False, "message": "변환할 일기가 없습니다."}
        
        print(f"총 {len(diaries)}개의 일기를 벡터 임베딩으로 변환합니다...")
        
        # 벡터 DB 준비
        db_path = os.path.join(os.path.dirname(__file__), 'my_local_qdrant_db', 'diary_embeddings.db')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        vector_conn = sqlite3.connect(db_path)
        vector_cursor = vector_conn.cursor()
        
        # 벡터 DB 테이블 생성
        vector_cursor.execute('''
            CREATE TABLE IF NOT EXISTS diary_embeddings (
                id INTEGER PRIMARY KEY,
                diary_id INTEGER UNIQUE,
                text TEXT,
                embedding BLOB,
                date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        converted_count = 0
        failed_count = 0
        
        for diary in diaries:
            try:
                # 텍스트 준비 (제목 + 내용)
                text = f"{diary.get('title', '')} {diary.get('content', '')}".strip()
                if not text:
                    print(f"일기 ID {diary['id']}: 텍스트가 비어있음")
                    failed_count += 1
                    continue
                
                # 벡터 임베딩 생성
                embedding = get_embedding(text)
                if embedding is None:
                    print(f"일기 ID {diary['id']}: 임베딩 생성 실패")
                    failed_count += 1
                    continue
                
                # 벡터 DB에 저장
                vector_cursor.execute('''
                    INSERT OR REPLACE INTO diary_embeddings (diary_id, text, embedding, date)
                    VALUES (?, ?, ?, ?)
                ''', (diary['id'], text, json.dumps(embedding), str(diary['created_at'])[:10]))
                
                converted_count += 1
                print(f"일기 ID {diary['id']}: 변환 완료 (텍스트 길이: {len(text)}, 임베딩 차원: {len(embedding)})")
                
            except Exception as e:
                print(f"일기 ID {diary['id']}: 변환 실패 - {e}")
                failed_count += 1
        
        vector_conn.commit()
        vector_conn.close()
        mysql_conn.close()
        
        return {
            "success": True,
            "message": f"벡터 임베딩 변환 완료",
            "total_diaries": len(diaries),
            "converted": converted_count,
            "failed": failed_count
        }
        
    except Exception as e:
        return {"success": False, "message": f"변환 실패: {str(e)}"}

def main():
    """메인 함수"""
    try:
        print("기존 일기들을 벡터 임베딩으로 변환을 시작합니다...")
        result = convert_existing_diaries()
        
        # 결과 출력
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(json.dumps({"success": False, "message": f"예상치 못한 오류: {str(e)}"}))

if __name__ == "__main__":
    main()

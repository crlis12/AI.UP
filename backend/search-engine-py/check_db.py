#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import os
import json

def check_vector_db():
    """벡터 DB 상태 확인"""
    db_path = 'my_local_qdrant_db/diary_embeddings.db'
    
    print("=== 벡터 DB 현재 상태 ===")
    print(f"DB 경로: {db_path}")
    print(f"DB 존재 여부: {os.path.exists(db_path)}")
    
    if not os.path.exists(db_path):
        print("❌ 벡터 DB 파일이 존재하지 않습니다.")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 테이블 존재 확인
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"테이블 목록: {[table[0] for table in tables]}")
        
        if ('diary_embeddings',) not in tables:
            print("❌ diary_embeddings 테이블이 존재하지 않습니다.")
            conn.close()
            return
        
        # 총 임베딩 개수
        cursor.execute('SELECT COUNT(*) FROM diary_embeddings')
        count = cursor.fetchone()[0]
        print(f"✅ 저장된 임베딩 개수: {count}")
        
        if count == 0:
            print("⚠️ 저장된 임베딩이 없습니다.")
        else:
            # 모든 임베딩 정보 조회
            cursor.execute('''
                SELECT diary_id, text, date, created_at, 
                       LENGTH(embedding) as embedding_size
                FROM diary_embeddings 
                ORDER BY created_at DESC
            ''')
            rows = cursor.fetchall()
            
            print(f"\n=== 저장된 {len(rows)}개 임베딩 목록 ===")
            for i, row in enumerate(rows, 1):
                diary_id, text, date, created_at, embedding_size = row
                print(f"\n{i}. 일기 ID: {diary_id}")
                print(f"   날짜: {date}")
                print(f"   생성시간: {created_at}")
                print(f"   임베딩 크기: {embedding_size} bytes")
                print(f"   내용: {text[:100]}{'...' if len(text) > 100 else ''}")
                print("-" * 50)
            
            # 임베딩 차원 확인
            cursor.execute('SELECT embedding FROM diary_embeddings LIMIT 1')
            first_embedding = cursor.fetchone()
            if first_embedding:
                try:
                    embedding_data = json.loads(first_embedding[0])
                    if isinstance(embedding_data, list):
                        print(f"\n✅ 임베딩 차원: {len(embedding_data)}차원")
                except json.JSONDecodeError:
                    print(f"\n❌ 임베딩 데이터 파싱 실패")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ DB 확인 중 오류: {str(e)}")

if __name__ == "__main__":
    check_vector_db()

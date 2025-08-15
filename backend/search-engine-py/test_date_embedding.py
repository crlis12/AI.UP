#!/usr/bin/env python3
"""
날짜 정보가 포함된 임베딩 테스트 스크립트
"""

import sys
import json
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models

# 설정
MODEL_NAME = 'jhgan/ko-sroberta-multitask'
COLLECTION_NAME = "my_journal_on_disk"
QDRANT_PATH = "../my_local_qdrant_db"

def test_date_embedding():
    """날짜 정보가 포함된 임베딩 테스트"""
    try:
        # 모델 로딩
        print("모델 로딩 중...")
        model = SentenceTransformer(MODEL_NAME)
        print("모델 로딩 완료!")
        
        # 테스트 케이스들
        test_cases = [
            {
                "date": "2025-03-23",
                "text": "어제 아이가 처음 걸었다",
                "description": "3월 23일에 3월 22일 걸음마 정보 포함"
            },
            {
                "date": "2025-03-22", 
                "text": "아이가 장난감을 가지고 놀았다",
                "description": "3월 22일 일반 일기"
            },
            {
                "date": "2025-03-21",
                "text": "아이가 말을 시작했다",
                "description": "3월 21일 말하기 시작"
            }
        ]
        
        print("\n=== 날짜 정보 포함 임베딩 테스트 ===")
        
        for i, case in enumerate(test_cases, 1):
            print(f"\n--- 테스트 케이스 {i} ---")
            print(f"날짜: {case['date']}")
            print(f"텍스트: {case['text']}")
            print(f"설명: {case['description']}")
            
            # 날짜 포함 텍스트 생성
            combined_text = f"{case['date']} {case['text']}"
            print(f"결합된 텍스트: {combined_text}")
            
            # 임베딩 생성
            embedding = model.encode(combined_text)
            print(f"임베딩 차원: {embedding.shape}")
            print(f"임베딩 샘플 (처음 5개): {embedding[:5].tolist()}")
            
        print("\n=== 테스트 완료 ===")
        
    except Exception as e:
        print(f"테스트 중 오류 발생: {e}")

def test_similarity_search():
    """날짜 정보를 포함한 유사도 검색 테스트"""
    try:
        # Qdrant 클라이언트와 모델 준비
        client = QdrantClient(path=QDRANT_PATH)
        model = SentenceTransformer(MODEL_NAME)
        
        print("\n=== 유사도 검색 테스트 ===")
        
        # 테스트 쿼리들
        test_queries = [
            "3월 22일에 아이가 걸음마를 했나요?",
            "아이가 언제 걸음마를 시작했나요?",
            "3월 21일에 아이가 뭘 했나요?"
        ]
        
        for query in test_queries:
            print(f"\n--- 쿼리: {query} ---")
            
            # 쿼리 임베딩
            query_vector = model.encode(query).tolist()
            
            # 검색
            search_results = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=3,
                with_payload=True,
                with_vectors=False
            )
            
            print(f"검색 결과 수: {len(search_results)}")
            
            for i, result in enumerate(search_results, 1):
                print(f"  {i}. ID: {result.id}")
                print(f"     점수: {result.score:.4f}")
                print(f"     날짜: {result.payload.get('date', 'N/A')}")
                print(f"     텍스트: {result.payload.get('text', 'N/A')[:50]}...")
                print(f"     결합 텍스트: {result.payload.get('combined_text', 'N/A')[:50]}...")
        
        print("\n=== 검색 테스트 완료 ===")
        
    except Exception as e:
        print(f"검색 테스트 중 오류 발생: {e}")

if __name__ == '__main__':
    print("날짜 정보 포함 임베딩 테스트 시작...")
    
    # 1. 임베딩 테스트
    test_date_embedding()
    
    # 2. 검색 테스트
    test_similarity_search()
    
    print("\n모든 테스트 완료!")

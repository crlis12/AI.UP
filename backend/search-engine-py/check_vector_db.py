#!/usr/bin/env python3
"""
VectorDB에 저장된 데이터 확인 스크립트
"""

import os
from qdrant_client import QdrantClient

# 설정 - 서버가 실제로 사용하는 경로
COLLECTION_NAME = "my_journal_on_disk"
QDRANT_PATH = "../my_local_qdrant_db"  # 상위 디렉토리의 VectorDB 사용

def check_vector_db():
    """VectorDB에 저장된 데이터를 확인합니다."""
    try:
        # Qdrant 클라이언트 연결
        client = QdrantClient(path=QDRANT_PATH)
        
        print("🔍 VectorDB 상태 확인 중...")
        print(f"📁 경로: {QDRANT_PATH}")
        print(f"📊 컬렉션: {COLLECTION_NAME}")
        print("-" * 50)
        
        # 컬렉션 정보 확인
        try:
            collection_info = client.get_collection(collection_name=COLLECTION_NAME)
            print(f"✅ 컬렉션 존재: {COLLECTION_NAME}")
            print(f"📈 벡터 개수: {collection_info.vectors_count}")
            print(f"🔢 차원: {collection_info.config.params.vectors.size}")
        except Exception as e:
            print(f"❌ 컬렉션을 찾을 수 없습니다: {e}")
            return
        
        # 저장된 모든 포인트 조회 (더 많은 데이터)
        print("\n📋 저장된 일기 목록:")
        print("-" * 50)
        
        # 최대 1000개까지 조회
        points = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=1000,
            with_payload=True,
            with_vectors=False
        )
        
        if points[0]:
            print(f"총 {len(points[0])}개의 벡터가 저장되어 있습니다.")
            for point in points[0]:
                print(f"ID: {point.id}")
                print(f"  제목+내용: {point.payload.get('text', 'N/A')[:80]}...")
                print(f"  날짜: {point.payload.get('date', 'N/A')}")
                print("-" * 40)
        else:
            print("📭 저장된 데이터가 없습니다.")
            
        # 특정 ID 검색 테스트
        print("\n🔍 특정 ID 검색 테스트:")
        print("-" * 50)
        test_ids = [13, 14, 15, 16]
        for test_id in test_ids:
            try:
                result = client.retrieve(
                    collection_name=COLLECTION_NAME,
                    ids=[test_id]
                )
                if result:
                    print(f"✅ ID {test_id} 발견: {result[0].payload.get('text', 'N/A')[:50]}...")
                else:
                    print(f"❌ ID {test_id} 없음")
            except Exception as e:
                print(f"❌ ID {test_id} 검색 오류: {e}")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🤖 LittleTodak VectorDB 확인 도구")
    print("=" * 60)
    check_vector_db()
    print("=" * 60)

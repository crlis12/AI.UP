#!/usr/bin/env python3
"""
VectorDB에서 유사한 일기 검색 스크립트
"""

import sys
import json
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient

# 설정
MODEL_NAME = 'jhgan/ko-sroberta-multitask'
COLLECTION_NAME = "my_journal_on_disk"
QDRANT_PATH = "../my_local_qdrant_db"  # 서버가 사용하는 경로

def setup_qdrant_and_model():
    """Qdrant 클라이언트와 임베딩 모델을 준비"""
    client = QdrantClient(path=QDRANT_PATH)
    model = SentenceTransformer(MODEL_NAME)
    
    # 컬렉션이 존재하는지 확인
    try:
        collection_info = client.get_collection(collection_name=COLLECTION_NAME)
        print(f"기존 컬렉션 '{COLLECTION_NAME}' 사용 중")
        return client, model
    except Exception as e:
        print(f"컬렉션 '{COLLECTION_NAME}'을 찾을 수 없습니다: {e}")
        return None, None

def search_similar_diaries(client, model, query_text, limit=5, score_threshold=0.5):
    """유사한 일기를 검색합니다"""
    try:
        # 쿼리 텍스트를 벡터로 임베딩
        query_vector = model.encode(query_text).tolist()
        
        # VectorDB에서 유사한 벡터 검색
        search_results = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=limit,
            score_threshold=score_threshold,
            with_payload=True,
            with_vectors=False
        )
        
        # 결과 정리
        results = []
        for result in search_results:
            results.append({
                'id': result.id,
                'score': result.score,
                'text': result.payload.get('text', ''),
                'date': result.payload.get('date', ''),
                'combined_text': result.payload.get('combined_text', ''),
                'similarity_percentage': round((1 - result.score) * 100, 2)  # 코사인 유사도를 퍼센트로
            })
        
        return {
            "success": True,
            "query": query_text,
            "results": results,
            "total_found": len(results)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "query": query_text,
            "results": []
        }

def main():
    """메인 함수 - Node.js에서 호출됨"""
    try:
        # 스크립트 시작 시 모델과 클라이언트를 한 번만 로딩
        client, model = setup_qdrant_and_model()
        
        if not client or not model:
            result = {"success": False, "message": "VectorDB 또는 모델을 초기화할 수 없습니다."}
            print(json.dumps(result, ensure_ascii=False))
            return

        # stdin에서 JSON 데이터 읽기
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        query_text = data.get('query')
        limit = data.get('limit', 5)
        score_threshold = data.get('score_threshold', 0.5)
        
        if not query_text:
            result = {"success": False, "message": "검색할 쿼리가 누락되었습니다."}
        else:
            result = search_similar_diaries(client, model, query_text, limit, score_threshold)
        
        # 결과를 stdout으로 출력 (JSON만)
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {"success": False, "message": f"스크립트 실행 오류: {str(e)}"}
        print(json.dumps(error_result, ensure_ascii=False))

if __name__ == '__main__':
    main()

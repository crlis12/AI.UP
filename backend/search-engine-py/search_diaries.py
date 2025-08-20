#!/usr/bin/env python3
"""
VectorDB에서 유사한 일기 검색 스크립트
"""

import sys
import json
import os
import sqlite3
from sentence_transformers import SentenceTransformer

# 설정
MODEL_NAME = 'jhgan/ko-sroberta-multitask'
COLLECTION_NAME = "my_journal_on_disk"
QDRANT_PATH = "../my_local_qdrant_db"
EMBEDDING_DB_PATH = os.path.join(os.path.dirname(__file__), 'my_local_qdrant_db', 'diary_embeddings.db')

def setup_model_and_data():
    """임베딩 모델을 준비하고 기존 데이터를 로드합니다
    우선순위: diary_embeddings.db → Qdrant storage.sqlite → 샘플 데이터
    """
    try:
        model = SentenceTransformer(MODEL_NAME)

        # 1) diary_embeddings.db 우선 사용 (일지 저장 시 업서트되는 DB)
        if os.path.exists(EMBEDDING_DB_PATH):
            try:
                conn = sqlite3.connect(EMBEDDING_DB_PATH)
                cursor = conn.cursor()
                cursor.execute('SELECT diary_id, text, embedding, date FROM diary_embeddings')
                rows = cursor.fetchall()
                data = []
                for diary_id, text, embedding_blob, date in rows:
                    try:
                        vec = json.loads(embedding_blob)
                        data.append({
                            'id': diary_id,
                            'vector': vec,
                            'text': text,
                            'date': date,
                            'combined_text': text
                        })
                    except Exception:
                        continue
                conn.close()
                if data:
                    return model, data
            except Exception:
                pass

        # 2) Qdrant storage.sqlite (있다면 사용)
        sqlite_path = os.path.join(QDRANT_PATH, "collection", COLLECTION_NAME, "storage.sqlite")
        if os.path.exists(sqlite_path):
            try:
                conn = sqlite3.connect(sqlite_path)
                cursor = conn.cursor()
                cursor.execute("SELECT id, point FROM points")
                rows = cursor.fetchall()
                data = []
                for row in rows:
                    if len(row) >= 2:
                        vector_id = row[0]
                        blob_data = row[1]
                        vector_data = parse_vector_blob(blob_data)
                        if vector_data and 'vector' in vector_data:
                            payload = vector_data.get('payload', {})
                            text = extract_text_from_payload(payload)
                            data.append({
                                'id': vector_id,
                                'vector': vector_data['vector'],
                                'payload': payload,
                                'text': text,
                                'date': payload.get('date', '2024-08-14'),
                                'combined_text': text
                            })
                conn.close()
                if data:
                    return model, data
            except Exception:
                pass

        # 3) 아무것도 없으면 샘플 데이터
        return model, get_sample_data()

    except Exception:
        return None, get_sample_data()

def extract_text_from_payload(payload):
    """페이로드에서 텍스트를 추출합니다"""
    try:
        if isinstance(payload, dict):
            text_fields = ['combined_text', 'text', 'content', 'body', 'message']
            for field in text_fields:
                if field in payload and payload[field]:
                    return str(payload[field])
            
            for key, value in payload.items():
                if isinstance(value, str) and len(value) > 10:
                    return value
            
            return str(payload)
        else:
            return str(payload)
    except Exception:
        return ""

def parse_vector_blob(blob_data):
    """BLOB 데이터를 파싱하여 벡터와 페이로드를 추출합니다"""
    try:
        data_bytes = bytes(blob_data) if not isinstance(blob_data, bytes) else blob_data
        
        try:
            import pickle
            unpickled = pickle.loads(data_bytes)
            
            if hasattr(unpickled, '__class__') and 'PointStruct' in str(unpickled.__class__):
                if hasattr(unpickled, 'vector') and unpickled.vector:
                    return {
                        'vector': unpickled.vector,
                        'payload': getattr(unpickled, 'payload', {})
                    }
                elif hasattr(unpickled, 'vectors') and unpickled.vectors:
                    if isinstance(unpickled.vectors, dict) and 'default' in unpickled.vectors:
                        return {
                            'vector': unpickled.vectors['default'],
                            'payload': getattr(unpickled, 'payload', {})
                        }
                    else:
                        return {
                            'vector': unpickled.vectors,
                            'payload': getattr(unpickled, 'payload', {})
                        }
                return None
            
            elif isinstance(unpickled, dict):
                if 'vector' in unpickled and 'payload' in unpickled:
                    return {
                        'vector': unpickled['vector'],
                        'payload': unpickled['payload']
                    }
                elif 'vector' in unpickled:
                    return {
                        'vector': unpickled['vector'],
                        'payload': {}
                    }
                else:
                    keys = list(unpickled.keys())
                    if keys:
                        first_key = keys[0]
                        first_value = unpickled[first_key]
                        if hasattr(first_value, '__len__'):
                            return {
                                'vector': first_value,
                                'payload': unpickled
                            }
                    return None
            elif hasattr(unpickled, '__len__'):
                return {
                    'vector': unpickled,
                    'payload': {}
                }
            else:
                return None
                
        except Exception:
            return None
            
    except Exception:
        return None

def get_sample_data():
    """테스트용 샘플 데이터를 반환합니다"""
    return [
        {
            'id': 1,
            'text': '아이가 밤에 자주 깨어나서 부모님이 걱정하고 있습니다. 수면 패턴이 불규칙하고, 밤중에 울거나 깨어나는 일이 잦습니다.',
            'date': '2024-08-14',
            'combined_text': '아이가 밤에 자주 깨어나서 부모님이 걱정하고 있습니다. 수면 패턴이 불규칙하고, 밤중에 울거나 깨어나는 일이 잦습니다.'
        },
        {
            'id': 2,
            'text': '아이의 수면 문제가 지속되고 있습니다. 밤에 2-3번씩 깨어나고, 다시 잠들기까지 시간이 오래 걸립니다.',
            'date': '2024-08-13',
            'combined_text': '아이의 수면 문제가 지속되고 있습니다. 밤에 2-3번씩 깨어나고, 다시 잠들기까지 시간이 오래 걸립니다.'
        },
        {
            'id': 3,
            'text': '아이가 밤에 자주 깨어나는 문제로 인해 부모님의 수면도 부족해지고 있습니다. 수면 환경 개선이 필요해 보입니다.',
            'date': '2024-08-12',
            'combined_text': '아이가 밤에 자주 깨어나는 문제로 인해 부모님의 수면도 부족해지고 있습니다. 수면 환경 개선이 필요해 보입니다.'
        }
    ]

def search_similar_diaries(model, data, query_text, limit=5, score_threshold=0.5):
    """유사한 일기를 검색합니다"""
    try:
        if not data:
            return {
                "success": False,
                "error": "데이터가 없습니다",
                "query": query_text,
                "results": []
            }
        
        query_vector = model.encode(query_text)
        results = []
        
        for item in data:
            if 'vector' in item and item['vector']:
                stored_vector = item['vector']
                similarity = cosine_similarity(query_vector, stored_vector)
                # 임계치 해석을 "유사도 >= 임계치"로 통일
                if similarity >= score_threshold:
                    results.append({
                        'id': item['id'],
                        'similarity': float(similarity),
                        'text': item.get('text', ''),
                        'date': item.get('date', '2024-08-14'),
                        'combined_text': item.get('combined_text', ''),
                    })
        
        # 유사도 높은 순으로 정렬 후 상위 N개 반환
        results.sort(key=lambda x: x.get('similarity', 0.0), reverse=True)
        results = results[:limit]
        
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

def cosine_similarity(vec1, vec2):
    """코사인 유사도를 계산합니다"""
    import numpy as np
    try:
        vec1 = np.array(vec1).reshape(-1)
        vec2 = np.array(vec2).reshape(-1)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(dot_product / (norm1 * norm2))
    except Exception:
        return 0.5

def main():
    """메인 함수"""
    try:
        model, data = setup_model_and_data()
        
        if not model:
            result = {"success": False, "message": "임베딩 모델을 초기화할 수 없습니다."}
            print(json.dumps(result, ensure_ascii=False))
            return

        input_data = sys.stdin.read()
        data_input = json.loads(input_data)
        
        query_text = data_input.get('query')
        limit = data_input.get('limit', 5)
        score_threshold = data_input.get('score_threshold', 0.5)
        
        if not query_text:
            result = {"success": False, "message": "검색할 쿼리가 누락되었습니다."}
        else:
            result = search_similar_diaries(model, data, query_text, limit, score_threshold)
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {"success": False, "message": f"스크립트 실행 오류: {str(e)}"}
        print(json.dumps(error_result, ensure_ascii=False))

if __name__ == '__main__':
    main()

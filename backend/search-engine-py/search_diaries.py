#!/usr/bin/env python3
"""
VectorDB에서 유사한 일기 검색 스크립트 (기존 데이터 활용)
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

def setup_model_and_data():
    """임베딩 모델을 준비하고 기존 데이터를 로드합니다"""
    try:
        # 임베딩 모델 로드
        model = SentenceTransformer(MODEL_NAME)
        
        # 기존 벡터 DB 경로 확인
        sqlite_path = os.path.join(QDRANT_PATH, "collection", COLLECTION_NAME, "storage.sqlite")
        
        if not os.path.exists(sqlite_path):
            # 테스트용 샘플 데이터 반환
            return model, get_sample_data()
        
        # SQLite에서 데이터 읽기 시도
        try:
            conn = sqlite3.connect(sqlite_path)
            cursor = conn.cursor()
            
            # points 테이블에서 id와 point(BLOB) 데이터 읽기
            cursor.execute("SELECT id, point FROM points LIMIT 10")
            rows = cursor.fetchall()
            
            data = []
            for i, row in enumerate(rows):
                if len(row) >= 2:
                    vector_id = row[0]
                    blob_data = row[1]  # BLOB 데이터
                    
                    # BLOB을 벡터로 변환
                    vector_data = parse_vector_blob(blob_data)
                    
                    if vector_data and 'vector' in vector_data:
                        # 페이로드에서 텍스트 추출
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
            else:
                return model, get_sample_data()
                
        except Exception as e:
            # SQLite 읽기 실패 시 샘플 데이터 사용
            return model, get_sample_data()
            
    except Exception as e:
        # 모델 로드 실패 시 샘플 데이터만 반환
        return None, get_sample_data()

def extract_text_from_payload(payload):
    """페이로드에서 텍스트를 추출합니다"""
    try:
        if isinstance(payload, dict):
            # 일반적인 텍스트 필드들 확인
            text_fields = ['combined_text', 'text', 'content', 'body', 'message']
            for field in text_fields:
                if field in payload and payload[field]:
                    return str(payload[field])
            
            # 모든 값 중에서 문자열인 것 찾기
            for key, value in payload.items():
                if isinstance(value, str) and len(value) > 10:  # 의미있는 텍스트 길이
                    return value
            
            # 페이로드 내용을 문자열로 변환
            return str(payload)
        else:
            return str(payload)
    except Exception:
        return ""

def parse_vector_blob(blob_data):
    """BLOB 데이터를 파싱하여 벡터와 페이로드를 추출합니다"""
    try:
        # BLOB을 바이트로 변환
        if isinstance(blob_data, bytes):
            data_bytes = blob_data
        else:
            data_bytes = bytes(blob_data)
        
        # Python pickle 언피클링 시도
        try:
            import pickle
            unpickled = pickle.loads(data_bytes)
            
            # 디버깅: 데이터 구조 확인
            # print(f"DEBUG: 언피클된 데이터 타입: {type(unpickled)}", file=sys.stderr)
            
            # PointStruct 객체 처리
            if hasattr(unpickled, '__class__') and 'PointStruct' in str(unpickled.__class__):
                # print(f"DEBUG: PointStruct 객체 감지", file=sys.stderr)
                
                # PointStruct에서 벡터와 페이로드 추출
                if hasattr(unpickled, 'vector') and unpickled.vector:
                    # print(f"DEBUG: vector 속성 발견 - 크기: {len(unpickled.vector)}", file=sys.stderr)
                    return {
                        'vector': unpickled.vector,
                        'payload': getattr(unpickled, 'payload', {})
                    }
                elif hasattr(unpickled, 'vectors') and unpickled.vectors:
                    # print(f"DEBUG: vectors 속성 발견", file=sys.stderr)
                    # vectors가 딕셔너리인 경우 'default' 키 사용
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
                else:
                    # print(f"DEBUG: vector/vectors 속성을 찾을 수 없음", file=sys.stderr)
                    # 객체의 모든 속성 확인
                    attrs = [attr for attr in dir(unpickled) if not attr.startswith('_')]
                    # print(f"DEBUG: 사용 가능한 속성: {attrs}", file=sys.stderr)
                    return None
            
            elif isinstance(unpickled, dict):
                # 딕셔너리 처리 (기존 로직)
                # print(f"DEBUG: 딕셔너리 키: {list(unpickled.keys())}", file=sys.stderr)
                
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
                    # 다른 키가 있는지 확인
                    keys = list(unpickled.keys())
                    if keys:
                        first_key = keys[0]
                        first_value = unpickled[first_key]
                        # print(f"DEBUG: 첫 번째 키 '{first_key}' 값 타입: {type(first_value)}", file=sys.stderr)
                        
                        if hasattr(first_value, '__len__'):
                            return {
                                'vector': first_value,
                                'payload': unpickled
                            }
                    return None
            elif hasattr(unpickled, '__len__'):
                # 리스트나 배열인 경우 벡터로 가정
                # print(f"DEBUG: 배열/리스트 길이: {len(unpickled)}", file=sys.stderr)
                return {
                    'vector': unpickled,
                    'payload': {}
                }
            else:
                # print(f"DEBUG: 지원되지 않는 데이터 타입: {type(unpickled)}", file=sys.stderr)
                return None
                
        except Exception as e:
            # pickle 실패 시 다른 방법 시도
            # print(f"DEBUG: pickle 오류: {e}", file=sys.stderr)
            return None
            
    except Exception as e:
        # print(f"DEBUG: BLOB 파싱 오류: {e}", file=sys.stderr)
        return None

def parse_serialized_data(raw_text):
    """직렬화된 데이터를 파싱합니다"""
    try:
        # Base64 디코딩 시도
        import base64
        decoded = base64.b64decode(raw_text)
        
        # Python pickle 언피클링 시도
        try:
            import pickle
            unpickled = pickle.loads(decoded)
            if isinstance(unpickled, str):
                return unpickled
            elif isinstance(unpickled, dict):
                # payload에서 텍스트 추출
                if 'combined_text' in unpickled:
                    return unpickled['combined_text']
                elif 'text' in unpickled:
                    return unpickled['text']
                else:
                    return str(unpickled)
            else:
                return str(unpickled)
        except:
            # pickle 실패 시 디코딩된 바이트를 문자열로 변환
            try:
                return decoded.decode('utf-8')
            except:
                return str(decoded)
                
    except Exception:
        # 모든 파싱 실패 시 원본 반환
        return raw_text

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
        },
        {
            'id': 4,
            'text': '아이의 수면 패턴을 관찰한 결과, 밤 11시경과 새벽 3시경에 자주 깨어나는 것을 확인했습니다.',
            'date': '2024-08-11',
            'combined_text': '아이의 수면 패턴을 관찰한 결과, 밤 11시경과 새벽 3시경에 자주 깨어나는 것을 확인했습니다.'
        },
        {
            'id': 5,
            'text': '수면 환경을 개선하기 위해 방의 온도와 조명을 조절했지만, 여전히 밤중 각성이 발생하고 있습니다.',
            'date': '2024-08-10',
            'combined_text': '수면 환경을 개선하기 위해 방의 온도와 조명을 조절했지만, 여전히 밤중 각성이 발생하고 있습니다.'
        }
    ]

def search_similar_diaries(model, data, query_text, limit=5, score_threshold=0.5):
    """유사한 일기를 검색합니다 (저장된 벡터 사용)"""
    try:
        if not data:
            return {
                "success": False,
                "error": "데이터가 없습니다",
                "query": query_text,
                "results": []
            }
        
        # 쿼리 텍스트를 벡터로 임베딩
        query_vector = model.encode(query_text)
        
        results = []
        for item in data:
            if 'vector' in item and item['vector']:
                # 저장된 벡터와 쿼리 벡터 간 코사인 유사도 계산
                stored_vector = item['vector']
                similarity = cosine_similarity(query_vector, stored_vector)
                score = 1.0 - similarity  # 거리 점수로 변환
                
                if score >= score_threshold:
                    results.append({
                        'id': item['id'],
                        'score': float(score),
                        'text': item.get('text', ''),
                        'date': item.get('date', '2024-08-14'),
                        'combined_text': item.get('combined_text', ''),
                        'similarity_percentage': round(similarity * 100, 2)
                    })
        
        # 점수순으로 정렬하고 limit 적용
        results.sort(key=lambda x: x['score'])
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
        # numpy 배열로 변환
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        # 1차원 배열로 변환
        vec1 = vec1.reshape(-1)
        vec2 = vec2.reshape(-1)
        
        # 코사인 유사도 계산
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(dot_product / (norm1 * norm2))
    except Exception as e:
        # 오류 발생 시 기본값 반환
        return 0.5

def main():
    """메인 함수 - Node.js에서 호출됨"""
    try:
        # 모델과 데이터 준비
        model, data = setup_model_and_data()
        
        if not model:
            result = {"success": False, "message": "임베딩 모델을 초기화할 수 없습니다."}
            print(json.dumps(result, ensure_ascii=False))
            return

        # stdin에서 JSON 데이터 읽기
        input_data = sys.stdin.read()
        data_input = json.loads(input_data)
        
        query_text = data_input.get('query')
        limit = data_input.get('limit', 5)
        score_threshold = data_input.get('score_threshold', 0.5)
        
        if not query_text:
            result = {"success": False, "message": "검색할 쿼리가 누락되었습니다."}
        else:
            result = search_similar_diaries(model, data, query_text, limit, score_threshold)
        
        # 결과를 stdout으로 출력 (JSON만)
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {"success": False, "message": f"스크립트 실행 오류: {str(e)}"}
        print(json.dumps(error_result, ensure_ascii=False))

if __name__ == '__main__':
    main()

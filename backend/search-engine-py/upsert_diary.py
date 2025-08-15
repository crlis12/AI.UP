#!/usr/bin/env python3
import sys
import json
import os
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models

# --- 설정 (Configuration) ---
MODEL_NAME = 'jhgan/ko-sroberta-multitask'
COLLECTION_NAME = "my_journal_on_disk"
# 상대 경로 사용 (스크립트 위치 기준)
QDRANT_PATH = "./my_local_qdrant_db"

def setup_qdrant_and_model():
    """Qdrant 클라이언트와 임베딩 모델을 한 번에 준비"""
    client = QdrantClient(path=QDRANT_PATH)
    model = SentenceTransformer(MODEL_NAME) # 모델 로딩을 이 함수로 이동
    
    # 컬렉션이 없으면 생성
    try:
        client.get_collection(collection_name=COLLECTION_NAME)
    except Exception:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=model.get_sentence_embedding_dimension(), 
                distance=models.Distance.COSINE
            ),
        )
        print(f"'{COLLECTION_NAME}' 컬렉션을 새로 생성했습니다.", file=sys.stderr)
    
    return client, model

def upsert_diary(client, model, diary_id, diary_text, diary_date):
    """일지를 벡터 DB에 저장/업데이트 (모델을 인자로 받음)"""
    try:
        # 날짜 정보를 포함한 텍스트 생성
        combined_text = f"{diary_date} {diary_text}"
        print(f"임베딩 생성 중: '{combined_text[:100]}...'", file=sys.stderr)
        
        # 날짜가 포함된 텍스트를 벡터로 임베딩
        vector = model.encode(combined_text).tolist()
        
        # 기존 ID가 있는지 확인
        try:
            existing = client.retrieve(
                collection_name=COLLECTION_NAME,
                ids=[diary_id]
            )
            if existing:
                print(f"ID {diary_id}가 이미 존재합니다. 업데이트합니다.", file=sys.stderr)
        except:
            print(f"ID {diary_id}를 새로 생성합니다.", file=sys.stderr)
        
        # Qdrant에 저장 (upsert로 덮어쓰기)
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=diary_id,
                    vector=vector,
                    payload={"date": diary_date, "text": diary_text, "combined_text": combined_text}
                )
            ],
            wait=True
        )
        
        # 저장 확인
        saved = client.retrieve(
            collection_name=COLLECTION_NAME,
            ids=[diary_id]
        )
        
        if saved:
            print(f"ID {diary_id} 저장 확인됨: {saved[0].payload.get('text', '')[:50]}...", file=sys.stderr)
            return {"success": True, "message": f"ID {diary_id} 저장 성공"}
        else:
            return {"success": False, "message": f"ID {diary_id} 저장 실패"}
        
    except Exception as e:
        print(f"벡터 DB 저장 오류: {e}", file=sys.stderr)
        return {"success": False, "message": f"벡터 DB 저장 오류: {str(e)}"}

def delete_diary(client, diary_id):
    """일지를 벡터 DB에서 삭제"""
    try:
        # 기존 ID가 있는지 확인
        try:
            existing = client.retrieve(
                collection_name=COLLECTION_NAME,
                ids=[diary_id]
            )
            if not existing:
                return {"success": False, "message": f"ID {diary_id}가 존재하지 않습니다."}
        except:
            return {"success": False, "message": f"ID {diary_id}를 찾을 수 없습니다."}
        
        # Qdrant에서 삭제
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=models.PointIdsList(
                points=[diary_id]
            ),
            wait=True
        )
        
        # 삭제 확인
        try:
            saved = client.retrieve(
                collection_name=COLLECTION_NAME,
                ids=[diary_id]
            )
            if not saved:
                return {"success": True, "message": f"ID {diary_id} 삭제 성공"}
            else:
                return {"success": False, "message": f"ID {diary_id} 삭제 실패"}
        except:
            return {"success": True, "message": f"ID {diary_id} 삭제 성공"}
        
    except Exception as e:
        print(f"벡터 DB 삭제 오류: {e}", file=sys.stderr)
        return {"success": False, "message": f"벡터 DB 삭제 오류: {str(e)}"}

def main():
    """메인 함수 - Node.js에서 호출됨"""
    try:
        # 스크립트 시작 시 모델과 클라이언트를 한 번만 로딩
        client, model = setup_qdrant_and_model()

        # stdin에서 JSON 데이터 읽기
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        action = data.get('action', 'upsert')  # 기본값은 upsert
        
        if action == 'delete':
            # 삭제 작업
            diary_id = data.get('id')
            if not diary_id:
                result = {"success": False, "message": "삭제할 ID가 누락되었습니다."}
            else:
                result = delete_diary(client, diary_id)
        else:
            # upsert 작업 (기존 로직)
            diary_id = data.get('id')
            diary_text = data.get('text')
            diary_date = data.get('date')
            
            if not all([diary_id, diary_text, diary_date]):
                result = {"success": False, "message": "필수 데이터(id, text, date) 누락"}
            else:
                result = upsert_diary(client, model, diary_id, diary_text, diary_date)
        
        # 결과를 stdout으로 출력 (JSON만)
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {"success": False, "message": f"스크립트 실행 오류: {str(e)}"}
        print(json.dumps(error_result, ensure_ascii=False))

if __name__ == '__main__':
    main()

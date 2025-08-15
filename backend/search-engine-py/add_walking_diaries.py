#!/usr/bin/env python3
"""
걸음마 관련 일기들을 VectorDB에 추가하는 스크립트
"""

import sys
import json
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models

# 설정
MODEL_NAME = 'jhgan/ko-sroberta-multitask'
COLLECTION_NAME = "my_journal_on_disk"
QDRANT_PATH = "../my_local_qdrant_db"

def setup_qdrant_and_model():
    """Qdrant 클라이언트와 임베딩 모델을 준비"""
    client = QdrantClient(path=QDRANT_PATH)
    model = SentenceTransformer(MODEL_NAME)
    
    # 컬렉션이 존재하는지 확인
    try:
        client.get_collection(collection_name=COLLECTION_NAME)
    except Exception:
        print("컬렉션을 찾을 수 없습니다.", file=sys.stderr)
        return None, None
    
    return client, model

def add_walking_diaries(client, model):
    """걸음마 관련 일기들을 VectorDB에 추가"""
    
    # 걸음마 관련 일기 데이터
    walking_diaries = [
        {
            "id": 20,
            "date": "2025-08-14",
            "text": "오늘은 거실 한가운데서 혼자 4초나 섰다! 예전 같으면 바로 엉덩방아를 찧었을 텐데, 눈빛이 \"나 이제 할 수 있어\" 하는 것 같았다."
        },
        {
            "id": 21,
            "date": "2025-08-15", 
            "text": "소파에 기대서 잡고 걷는 게 훨씬 안정적이 됐다. 한 손은 장난감 들고, 한 손으로만 잡는데도 안 넘어지다니… 대견하다."
        },
        {
            "id": 22,
            "date": "2025-08-16",
            "text": "아침에 처음으로 아무것도 잡지 않고 한 발을 떼었다. 비록 한 걸음뿐이었지만, 순간 심장이 두근거렸다."
        },
        {
            "id": 23,
            "date": "2025-08-17",
            "text": "오늘은 외출해서 놀이터에 갔다. 모래 위에서 발을 툭툭 구르며 균형 잡는 모습이 너무 귀여웠다. 신발이 조금 큰지 자꾸 벗겨져서 웃음이 났다."
        },
        {
            "id": 24,
            "date": "2025-08-18",
            "text": "책장 앞에서 책을 꺼내려다, 무심코 두 걸음을 걸었다! 나도 깜짝 놀라서 \"와!\" 하고 박수쳤더니, 아이가 씩 웃으며 다시 앉았다."
        },
        {
            "id": 25,
            "date": "2025-08-19",
            "text": "아침에 기저귀 갈다가 갑자기 일어나서 나를 향해 세 걸음을 걸어왔다. 아직 몸이 덜 안정돼서 비틀거렸지만, 분명한 진전이다."
        },
        {
            "id": 26,
            "date": "2025-08-20",
            "text": "오늘은 집 안 여기저기를 손으로 짚으며 순회(?)했다. 장난감을 소파에 올려놓고, 다시 와서 가져가는 모습이 마치 집안 일을 하는 것처럼 보였다."
        },
        {
            "id": 27,
            "date": "2025-08-21",
            "text": "거실에서 놀이하다가 혼자서 서 있는 시간이 10초를 넘겼다! 눈을 반짝이며 주위를 둘러보는 표정이 꼭 탐험가 같았다."
        },
        {
            "id": 28,
            "date": "2025-08-22",
            "text": "오늘은 걷기보다 무릎 꿇고 일어나기 연습을 많이 했다. 몇 번은 실패했지만, 성공할 때마다 엄청나게 뿌듯한 표정을 지었다."
        },
        {
            "id": 29,
            "date": "2025-08-23",
            "text": "드디어! 짧지만 네 걸음을 혼자 걸었다. 나는 휴대폰을 들고 있었지만, 순간 그걸 내려놓고 아이를 꼭 안아줬다. 감격의 순간."
        }
    ]
    
    print(f"총 {len(walking_diaries)}개의 걸음마 관련 일기를 추가합니다...")
    
    success_count = 0
    for diary in walking_diaries:
        try:
            # 날짜 정보를 포함한 텍스트 생성
            combined_text = f"{diary['date']} {diary['text']}"
            print(f"ID {diary['id']} 임베딩 생성 중: '{combined_text[:50]}...'")
            
            # 날짜가 포함된 텍스트를 벡터로 임베딩
            vector = model.encode(combined_text).tolist()
            
            # Qdrant에 저장
            client.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    models.PointStruct(
                        id=diary['id'],
                        vector=vector,
                        payload={
                            "date": diary['date'], 
                            "text": diary['text'], 
                            "combined_text": combined_text
                        }
                    )
                ],
                wait=True
            )
            
            print(f"✅ ID {diary['id']} 저장 성공")
            success_count += 1
            
        except Exception as e:
            print(f"❌ ID {diary['id']} 저장 실패: {e}")
    
    print(f"\n🎉 총 {success_count}개의 일기 추가 완료!")
    return success_count

def main():
    """메인 함수"""
    try:
        print("🚶‍♂️ 걸음마 관련 일기 추가 시작...")
        
        # Qdrant 클라이언트와 모델 준비
        client, model = setup_qdrant_and_model()
        
        if not client or not model:
            print("❌ VectorDB 또는 모델을 초기화할 수 없습니다.")
            return
        
        # 걸음마 관련 일기 추가
        success_count = add_walking_diaries(client, model)
        
        if success_count > 0:
            print(f"\n✅ {success_count}개의 걸음마 관련 일기가 성공적으로 추가되었습니다!")
            print("이제 RAG 검색으로 '아이가 걸을 수 있나요?' 질문에 답할 수 있습니다!")
        else:
            print("❌ 일기 추가에 실패했습니다.")
        
    except Exception as e:
        print(f"💥 스크립트 실행 중 오류 발생: {e}")

if __name__ == '__main__':
    main()

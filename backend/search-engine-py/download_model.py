#!/usr/bin/env python3
"""
한국어 임베딩 모델 사전 다운로드 스크립트
"""

import sys
from sentence_transformers import SentenceTransformer

def download_model():
    """한국어 임베딩 모델을 다운로드합니다."""
    try:
        print("🇰🇷 한국어 임베딩 모델 다운로드를 시작합니다...")
        print("📥 모델: jhgan/ko-sroberta-multitask")
        print("⏳ 다운로드 중... (처음 실행 시 시간이 오래 걸릴 수 있습니다)")
        
        # 모델 다운로드
        model = SentenceTransformer('jhgan/ko-sroberta-multitask')
        
        print("✅ 모델 다운로드 완료!")
        print(f"📊 모델 차원: {model.get_sentence_embedding_dimension()}")
        
        # 간단한 테스트
        test_text = "안녕하세요, 테스트입니다."
        embedding = model.encode(test_text)
        print(f"🧪 테스트 임베딩 생성 성공: {len(embedding)} 차원")
        
        return True
        
    except Exception as e:
        print(f"❌ 모델 다운로드 실패: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("🤖 LittleTodak AI 임베딩 모델 다운로더")
    print("=" * 50)
    
    success = download_model()
    
    if success:
        print("\n🎉 모든 준비가 완료되었습니다!")
        print("이제 일기 API를 테스트할 수 있습니다.")
    else:
        print("\n💥 모델 다운로드에 실패했습니다.")
        print("인터넷 연결과 Python 환경을 확인해주세요.")
    
    print("=" * 50)

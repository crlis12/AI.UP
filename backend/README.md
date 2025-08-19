# LittleTodak Backend

## 🚀 주요 기능

- **일기 관리**: MySQL과 VectorDB 동기화
- **AI 분석**: 한국어 임베딩 모델을 사용한 벡터 검색
- **사용자 인증**: JWT 기반 인증 시스템

## 📋 개선된 기능

### 1. MySQL + VectorDB 동기화

- 일기 생성/수정 시 MySQL과 VectorDB에 동시 저장
- 일기 삭제 시 VectorDB에서도 자동 삭제
- 에러 발생 시 MySQL 데이터는 보존

### 2. 설정 관리

- `config.js`를 통한 중앙화된 설정 관리
- 환경 변수 지원으로 보안 강화
- 개발/운영 환경별 설정 분리 가능

### 3. 로깅 및 모니터링

- 상세한 타임스탬프 로깅
- VectorDB 작업 상태 추적
- 에러 발생 시 상세 정보 제공

## ⚙️ 설정 방법

### 1. 환경 변수 설정 (선택사항)

```bash
export DB_HOST=localhost
export DB_USER=your_username
export DB_PASSWORD=your_password
export DB_NAME=your_database
export DB_PORT=3306
export PYTHON_PATH=python3
```

### 2. Python 의존성 설치

```bash
cd search-engine-py
pip install -r requirements.txt
```

### 3. VectorDB 초기화

- Qdrant 데이터베이스가 자동으로 생성됩니다
- 첫 실행 시 한국어 임베딩 모델을 다운로드합니다

## 🔧 API 엔드포인트

- `POST /diaries` - 일기 생성 (MySQL + VectorDB 동시 저장)
- `GET /diaries` - 모든 일기 조회
- `GET /diaries/:userId` - 사용자별 일기 조회
- `PUT /diaries/:id` - 일기 수정 (MySQL + VectorDB 동시 업데이트)
- `DELETE /diaries/:id` - 일기 삭제 (MySQL + VectorDB 동시 삭제)

## 📊 데이터 흐름

1. **일기 생성**: MySQL 저장 → VectorDB 임베딩 → 동기화 완료
2. **일기 수정**: MySQL 업데이트 → VectorDB 재임베딩 → 동기화 완료
3. **일기 삭제**: VectorDB 벡터 삭제 → MySQL 레코드 삭제 → 동기화 완료

## 🚨 주의사항

- VectorDB 작업 실패 시에도 MySQL 데이터는 보존됩니다
- Python 스크립트 실행 권한이 필요합니다
- 한국어 임베딩 모델 다운로드에 시간이 걸릴 수 있습니다

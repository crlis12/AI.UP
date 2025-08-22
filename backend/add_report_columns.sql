-- 1. checklist-alert 텍스트 저장을 위한 컬럼 추가
ALTER TABLE reports 
ADD COLUMN alert_message TEXT COMMENT '체크리스트 알림 메시지';

-- 2. 주차 정보 저장을 위한 컬럼 추가 
ALTER TABLE reports 
ADD COLUMN week_number INT DEFAULT 1 COMMENT '주차 번호 (1주차, 2주차 등)';

-- 주차별 인덱스 추가 (성능 최적화)
ALTER TABLE reports 
ADD INDEX idx_child_week (child_id, week_number);

-- 주차별 조회를 위한 복합 인덱스 추가
ALTER TABLE reports 
ADD INDEX idx_parent_child_week (parent_id, child_id, week_number);

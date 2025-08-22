-- reports 테이블에 계산된 컬럼 추가

-- 1. 총점 컬럼 추가 (6개 영역 점수의 합계)
ALTER TABLE reports 
ADD COLUMN total_score DECIMAL(5,2) GENERATED ALWAYS AS (
    gross_motor_score + fine_motor_score + cognitive_score +
    language_score + social_score + self_help_score
) STORED COMMENT '총점 (6개 영역 합계)';

-- 2. 평균 점수 컬럼 추가 (6개 영역 점수의 평균)
ALTER TABLE reports 
ADD COLUMN average_score DECIMAL(5,2) GENERATED ALWAYS AS (
    (gross_motor_score + fine_motor_score + cognitive_score +
     language_score + social_score + self_help_score) / 6
) STORED COMMENT '평균 점수 (6개 영역 평균)';

-- 성능 최적화를 위한 인덱스 추가
ALTER TABLE reports 
ADD INDEX idx_total_score (total_score);

ALTER TABLE reports 
ADD INDEX idx_average_score (average_score);

-- 자녀별 점수 분석을 위한 복합 인덱스 추가
ALTER TABLE reports 
ADD INDEX idx_child_total_score (child_id, total_score);

ALTER TABLE reports 
ADD INDEX idx_child_average_score (child_id, average_score);

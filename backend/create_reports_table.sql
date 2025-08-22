CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    child_id INT NOT NULL,
    report_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 필수 점수 컬럼들
    gross_motor_score DECIMAL(5,2) NOT NULL COMMENT '대근육 점수',
    fine_motor_score DECIMAL(5,2) NOT NULL COMMENT '소근육 운동 점수',
    cognitive_score DECIMAL(5,2) NOT NULL COMMENT '인지 점수',
    language_score DECIMAL(5,2) NOT NULL COMMENT '언어 점수',
    social_score DECIMAL(5,2) NOT NULL COMMENT '사회성 점수',
    self_help_score DECIMAL(5,2) NOT NULL COMMENT '자조 점수',
    
    -- 추가 질문 컬럼들 (정수값 저장 가능)
    additional_question INT DEFAULT 0 COMMENT '추가질문 점수/값',
    
    -- 외래키 제약조건
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    
    -- 인덱스 추가
    INDEX idx_parent_child (parent_id, child_id),
    INDEX idx_report_date (report_date),
    INDEX idx_child_date (child_id, report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='발달 평가 리포트 테이블';
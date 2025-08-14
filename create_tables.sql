-- AI.UP 데이터베이스 테이블 생성 스크립트

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    nickname VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 인증 코드 테이블
CREATE TABLE IF NOT EXISTS verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_code (email, code),
    INDEX idx_expires_at (expires_at)
);

-- 3. 아동 정보 테이블
CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    gender ENUM('male', 'female', 'other'),
    nickname VARCHAR(50),
    profile_image TEXT,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    development_stage VARCHAR(50),
    special_needs TEXT,
    medical_notes TEXT,
    school_name VARCHAR(100),
    grade_level VARCHAR(20),
    interests TEXT,
    favorite_activities TEXT,
    personality_traits JSON,
    learning_style VARCHAR(50),
    communication_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_parent_id (parent_id)
);

-- 4. 일기 테이블 (간소화)
CREATE TABLE IF NOT EXISTS diaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    INDEX idx_child_id (child_id),
    INDEX idx_date (date),
    UNIQUE KEY unique_child_date (child_id, date)
);

-- 5. 월령 그룹 정보를 저장할 테이블
CREATE TABLE IF NOT EXISTS AgeGroups (
    age_group_id INT PRIMARY KEY AUTO_INCREMENT,
    age_range_text VARCHAR(20) NOT NULL UNIQUE,
    min_months INT NOT NULL,
    max_months INT NOT NULL
);

-- 6. 발달 영역 정보를 저장할 테이블
CREATE TABLE IF NOT EXISTS Domains (
    domain_index INT PRIMARY KEY AUTO_INCREMENT,
    domain_id INT NOT NULL,
    domain_name VARCHAR(50) NOT NULL UNIQUE
);

-- 기본 영역 데이터 삽입
INSERT IGNORE INTO Domains (domain_id, domain_name) VALUES 
(1, '자조'),
(2, '의사소통'),
(3, '대근육운동'),
(4, '소근육운동'),
(5, '문제해결'),
(6, '개인사회성');

-- 7. 모든 문항 정보를 저장할 테이블
CREATE TABLE IF NOT EXISTS Questions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    age_group_id INT NOT NULL,
    domain_id INT NOT NULL,
    is_additional BOOLEAN NOT NULL DEFAULT FALSE,
    question_number INT NOT NULL,
    question_text TEXT NOT NULL,
    question_note TEXT,
    additional_category VARCHAR(50),
    FOREIGN KEY (age_group_id) REFERENCES AgeGroups(age_group_id),
    FOREIGN KEY (domain_id) REFERENCES Domains(domain_index)
);

-- 8. 월령 및 영역별 절단점 점수를 저장할 테이블
CREATE TABLE IF NOT EXISTS CutoffScores (
    cutoff_id INT PRIMARY KEY AUTO_INCREMENT,
    age_group_id INT NOT NULL,
    domain_id INT NOT NULL,
    cutoff_a INT NOT NULL, -- 가(a) 미만일 경우 : 위험군 상담 필요
    cutoff_b INT NOT NULL, -- 나(b) 미만 가 이상 일 경우 : 주의 깊게 관찰 요망 
    cutoff_c INT NOT NULL, -- 다(c) 미만 나 이상 일 경우 : 정상 범주 
    UNIQUE (age_group_id, domain_id),
    FOREIGN KEY (age_group_id) REFERENCES AgeGroups(age_group_id),
    FOREIGN KEY (domain_id) REFERENCES Domains(domain_index)
);

-- 9. 아동별 점수 저장 테이블
CREATE TABLE IF NOT EXISTS child_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    child_id INT NOT NULL,
    age_in_months INT NOT NULL,
    assessment_date DATE NOT NULL,
    -- 각 발달 영역별 점수
    self_care_score INT DEFAULT 0,           -- 자조
    communication_score INT DEFAULT 0,       -- 의사소통
    gross_motor_score INT DEFAULT 0,         -- 대근육운동
    fine_motor_score INT DEFAULT 0,          -- 소근육운동
    problem_solving_score INT DEFAULT 0,     -- 문제해결
    personal_social_score INT DEFAULT 0,     -- 개인사회성
    -- 전체 점수 및 상태
    total_score INT DEFAULT 0,
    assessment_status ENUM('정상', '주의', '위험') DEFAULT '정상',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    INDEX idx_child_id (child_id),
    INDEX idx_assessment_date (assessment_date)
);



-- 테이블 생성 완료 확인
SHOW TABLES;

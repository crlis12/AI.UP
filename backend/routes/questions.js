const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 연결 가져오기

// 테스트 라우트
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Questions 라우트가 정상적으로 작동합니다!'
  });
});

// 자녀의 나이에 맞는 질문들을 가져오는 API
router.get('/child/:childId', async (req, res) => {
  try {
    const childId = req.params.childId;
    
    // 임시 테스트용 더미 데이터
    console.log('Questions API 호출됨 - childId:', childId);
    
    // 데이터베이스 연결 테스트
    if (!db) {
      console.error('데이터베이스 연결이 없습니다');
      return res.status(500).json({
        success: false,
        message: '데이터베이스 연결 오류'
      });
    }
    
    if (!childId) {
      return res.status(400).json({
        success: false,
        message: '자녀 ID가 필요합니다.'
      });
    }

    // 먼저 자녀 정보 가져오기 (나이 계산을 위해)
    const childQuery = `
      SELECT id, name, birth_date 
      FROM children 
      WHERE id = ? AND is_active = TRUE
    `;
    
    db.query(childQuery, [childId], (err, childRows) => {
      if (err) {
        console.error('자녀 정보 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }
      
      if (childRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '자녀 정보를 찾을 수 없습니다.'
        });
      }
      
      const child = childRows[0];
      
      // 자녀의 현재 나이(개월 수) 계산
      const today = new Date();
      const birthDate = new Date(child.birth_date);
      let ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
      if (today.getDate() < birthDate.getDate()) {
        ageInMonths -= 1;
      }
      ageInMonths = Math.max(0, ageInMonths);
      
      // ±5개월 오차범위 계산
      const minAge = Math.max(0, ageInMonths - 5); // 음수 방지, 최소 0개월
      const maxAge = ageInMonths + 5;
      
      console.log('자녀 나이 정보:');
      console.log('  - 실제 나이:', ageInMonths, '개월');
      console.log('  - 검색 범위:', minAge, '~', maxAge, '개월');
      
      // 먼저 테이블 존재 여부 확인
      console.log('데이터베이스 테이블 확인 중...');
      
      // Questions 테이블 데이터 개수 확인
      db.query('SELECT COUNT(*) as count FROM Questions', (countErr, countResult) => {
        if (countErr) {
          console.error('Questions 테이블 조회 오류:', countErr);
        } else {
          console.log('Questions 테이블 총 데이터 수:', countResult[0]?.count || 0);
        }
      });
      
      // AgeGroups 테이블 확인
      db.query('SELECT * FROM AgeGroups', (ageErr, ageResult) => {
        if (ageErr) {
          console.error('AgeGroups 테이블 조회 오류:', ageErr);
        } else {
          console.log('AgeGroups 테이블 데이터:', ageResult);
        }
      });
      
      // 오차범위를 고려한 질문들 조회
      // 로직: 자녀의 나이 범위(minAge ~ maxAge)와 겹치는 모든 연령대의 질문을 가져옴
      const questionsQuery = `
        SELECT 
          q.question_id,
          q.question_text,
          q.question_note,
          q.question_number,
          q.is_additional,
          q.additional_category,
          d.domain_name,
          ag.age_range_text,
          ag.min_months,
          ag.max_months
        FROM Questions q
        JOIN AgeGroups ag ON q.age_group_id = ag.age_group_id
        JOIN Domains d ON q.domain_id = d.domain_index
        WHERE ag.min_months <= ? AND ag.max_months >= ?
        ORDER BY d.domain_id, q.question_number
      `;
      
      console.log('질문 조회 쿼리 실행 (±5개월 오차범위 적용)');
      console.log('검색 조건:');
      console.log('  - 자녀 최소 나이:', minAge, '개월');
      console.log('  - 자녀 최대 나이:', maxAge, '개월');
      console.log('  - 실제 쿼리: WHERE ag.min_months <=', maxAge, 'AND ag.max_months >=', minAge);
      
      // 범위 겹침 체크: ag.min_months <= maxAge AND ag.max_months >= minAge
      db.query(questionsQuery, [maxAge, minAge], (questionsErr, questionRows) => {
        if (questionsErr) {
          console.error('질문 조회 오류:', questionsErr);
          return res.status(500).json({
            success: false,
            message: '질문 조회 중 오류가 발생했습니다.'
          });
        }
        
        return res.status(200).json({
          success: true,
          child: {
            id: child.id,
            name: child.name,
            ageInMonths: ageInMonths
          },
          questions: questionRows
        });
      });
    });
    
  } catch (error) {
    console.error('질문 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 특정 발달 영역의 질문들만 가져오는 API
router.get('/child/:childId/domain/:domainId', async (req, res) => {
  try {
    const { childId, domainId } = req.params;
    
    if (!childId || !domainId) {
      return res.status(400).json({
        success: false,
        message: '자녀 ID와 발달 영역 ID가 필요합니다.'
      });
    }

    // 자녀 정보 가져오기
    const childQuery = `
      SELECT id, name, birth_date 
      FROM children 
      WHERE id = ? AND is_active = TRUE
    `;
    
    db.query(childQuery, [childId], (err, childRows) => {
      if (err) {
        console.error('자녀 정보 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }
      
      if (childRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '자녀 정보를 찾을 수 없습니다.'
        });
      }
      
      const child = childRows[0];
      
      // 나이 계산
      const today = new Date();
      const birthDate = new Date(child.birth_date);
      let ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
      if (today.getDate() < birthDate.getDate()) {
        ageInMonths -= 1;
      }
      ageInMonths = Math.max(0, ageInMonths);
      
      // 특정 발달 영역의 질문들 조회
      const questionsQuery = `
        SELECT 
          q.question_id,
          q.question_text,
          q.question_note,
          q.question_number,
          q.is_additional,
          q.additional_category,
          d.domain_name,
          ag.age_range_text
        FROM Questions q
        JOIN AgeGroups ag ON q.age_group_id = ag.age_group_id
        JOIN Domains d ON q.domain_id = d.domain_index
        WHERE ag.min_months <= ? AND ag.max_months >= ? AND d.domain_id = ?
        ORDER BY q.question_number
      `;
      
      db.query(questionsQuery, [ageInMonths, ageInMonths, domainId], (questionsErr, questionRows) => {
        if (questionsErr) {
          console.error('질문 조회 오류:', questionsErr);
          return res.status(500).json({
            success: false,
            message: '질문 조회 중 오류가 발생했습니다.'
          });
        }
        
        return res.status(200).json({
          success: true,
          child: {
            id: child.id,
            name: child.name,
            ageInMonths: ageInMonths
          },
          domain: questionRows.length > 0 ? questionRows[0].domain_name : '',
          questions: questionRows
        });
      });
    });
    
  } catch (error) {
    console.error('질문 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 모든 발달 영역 목록 가져오기
router.get('/domains', (req, res) => {
  try {
    const query = `
      SELECT domain_id, domain_name 
      FROM Domains 
      ORDER BY domain_id
    `;
    
    db.query(query, (err, rows) => {
      if (err) {
        console.error('발달 영역 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }
      
      return res.status(200).json({
        success: true,
        domains: rows
      });
    });
    
  } catch (error) {
    console.error('발달 영역 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;

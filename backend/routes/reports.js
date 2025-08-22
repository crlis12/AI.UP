const express = require('express');
const router = express.Router();
const db = require('../db');

// 리포트 저장
router.post('/', async (req, res) => {
  try {
    const {
      parent_id,
      child_id,
      gross_motor_score,
      fine_motor_score,
      cognitive_score,
      language_score,
      social_score,
      self_help_score,
      additional_question,
      alert_message,
      week_number
    } = req.body || {};

    // 필수 필드 검증
    if (!parent_id || !child_id) {
      return res.status(400).json({
        success: false,
        message: 'parent_id와 child_id는 필수입니다.'
      });
    }

    // null 값을 0으로 변환하는 함수
    const nullToZero = (value) => {
      return (value === null || value === undefined || isNaN(value)) ? 0 : Number(value);
    };

    // 점수 데이터 정리 (null -> 0 변환)
    const scores = {
      gross_motor_score: nullToZero(gross_motor_score),
      fine_motor_score: nullToZero(fine_motor_score),
      cognitive_score: nullToZero(cognitive_score),
      language_score: nullToZero(language_score),
      social_score: nullToZero(social_score),
      self_help_score: nullToZero(self_help_score),
      additional_question: nullToZero(additional_question)
    };

    // 주차 번호 자동 계산 (해당 자녀의 기존 리포트 개수 + 1)
    const getNextWeekNumber = () => {
      return new Promise((resolve, reject) => {
        if (week_number && week_number > 0) {
          // 명시적으로 주차가 제공된 경우
          resolve(week_number);
        } else {
          // 자동 계산: 해당 자녀의 기존 리포트 개수 + 1
          db.query(
            'SELECT MAX(week_number) as max_week FROM reports WHERE child_id = ?',
            [child_id],
            (err, result) => {
              if (err) {
                reject(err);
              } else {
                const maxWeek = result[0]?.max_week || 0;
                resolve(maxWeek + 1);
              }
            }
          );
        }
      });
    };

    const nextWeekNumber = await getNextWeekNumber();

    console.log('리포트 저장 데이터:', {
      parent_id,
      child_id,
      week_number: nextWeekNumber,
      alert_message: alert_message || null,
      ...scores
    });

    const insertQuery = `
      INSERT INTO reports (
        parent_id,
        child_id,
        gross_motor_score,
        fine_motor_score,
        cognitive_score,
        language_score,
        social_score,
        self_help_score,
        additional_question,
        alert_message,
        week_number,
        report_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      parent_id,
      child_id,
      scores.gross_motor_score,
      scores.fine_motor_score,
      scores.cognitive_score,
      scores.language_score,
      scores.social_score,
      scores.self_help_score,
      scores.additional_question,
      alert_message || null,
      nextWeekNumber
    ];

    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error('리포트 저장 DB 오류:', err);
        return res.status(500).json({
          success: false,
          message: '리포트 저장 중 오류가 발생했습니다.',
          error: err.message
        });
      }

      console.log('리포트 저장 성공, ID:', result.insertId);
      res.json({
        success: true,
        message: '리포트가 성공적으로 저장되었습니다.',
        reportId: result.insertId
      });
    });
  } catch (error) {
    console.error('리포트 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 특정 자녀의 리포트 목록 조회
router.get('/child/:childId', (req, res) => {
  const { childId } = req.params;

  const query = `
    SELECT r.*, u.username as parent_name, c.name as child_name
    FROM reports r
    LEFT JOIN users u ON r.parent_id = u.id
    LEFT JOIN children c ON r.child_id = c.id
    WHERE r.child_id = ?
    ORDER BY r.report_date DESC
  `;

  db.query(query, [childId], (err, results) => {
    if (err) {
      console.error('리포트 조회 DB 오류:', err);
      return res.status(500).json({
        success: false,
        message: '리포트 조회 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      reports: results
    });
  });
});

// 특정 리포트 상세 조회
router.get('/:reportId', (req, res) => {
  const { reportId } = req.params;

  const query = `
    SELECT r.*, u.username as parent_name, c.name as child_name
    FROM reports r
    LEFT JOIN users u ON r.parent_id = u.id
    LEFT JOIN children c ON r.child_id = c.id
    WHERE r.id = ?
  `;

  db.query(query, [reportId], (err, results) => {
    if (err) {
      console.error('리포트 상세 조회 DB 오류:', err);
      return res.status(500).json({
        success: false,
        message: '리포트 조회 중 오류가 발생했습니다.'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: '리포트를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      report: results[0]
    });
  });
});

module.exports = router;
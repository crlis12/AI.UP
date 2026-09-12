const express = require('express');
const db = require('../db');
const router = express.Router();

// 모든 상담사 목록 조회
router.get('/', (req, res) => {
  try {
    const query = `
      SELECT 
        idx, counselor_id, name, domain, region_id, region
      FROM counselors 
      ORDER BY region_id, name
    `;

    db.query(query, (err, rows) => {
      if (err) {
        console.error('상담사 목록 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        counselors: rows,
        count: rows.length
      });
    });
  } catch (error) {
    console.error('상담사 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 지역별 상담사 조회
router.get('/region/:regionId', (req, res) => {
  try {
    const regionId = parseInt(req.params.regionId);

    if (!regionId || regionId < 1 || regionId > 10) {
      return res.status(400).json({
        success: false,
        message: '올바른 지역 ID를 입력해주세요. (1-10)',
      });
    }

    const query = `
      SELECT 
        idx, counselor_id, name, domain, region_id, region
      FROM counselors 
      WHERE region_id = ?
      ORDER BY name
    `;

    db.query(query, [regionId], (err, rows) => {
      if (err) {
        console.error('지역별 상담사 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        counselors: rows,
        count: rows.length,
        region_id: regionId
      });
    });
  } catch (error) {
    console.error('지역별 상담사 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 도메인별 상담사 조회
router.get('/domain/:domain', (req, res) => {
  try {
    const domain = decodeURIComponent(req.params.domain);

    if (!domain || domain.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '도메인을 입력해주세요.',
      });
    }

    const query = `
      SELECT 
        idx, counselor_id, name, domain, region_id, region
      FROM counselors 
      WHERE domain = ?
      ORDER BY region_id, name
    `;

    db.query(query, [domain], (err, rows) => {
      if (err) {
        console.error('도메인별 상담사 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        counselors: rows,
        count: rows.length,
        domain: domain
      });
    });
  } catch (error) {
    console.error('도메인별 상담사 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 특정 상담사 정보 조회
router.get('/:counselorId', (req, res) => {
  try {
    const counselorId = req.params.counselorId;

    if (!counselorId) {
      return res.status(400).json({
        success: false,
        message: '상담사 ID가 필요합니다.',
      });
    }

    const query = `
      SELECT 
        idx, counselor_id, name, domain, region_id, region
      FROM counselors 
      WHERE counselor_id = ?
    `;

    db.query(query, [counselorId], (err, rows) => {
      if (err) {
        console.error('상담사 정보 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '상담사 정보를 찾을 수 없습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        counselor: rows[0]
      });
    });
  } catch (error) {
    console.error('상담사 정보 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 상담사 매칭 요청 (매칭 테이블이 없으므로 로그만 기록)
router.post('/match', (req, res) => {
  try {
    const { child_id, counselor_id, message } = req.body;

    if (!child_id || !counselor_id) {
      return res.status(400).json({
        success: false,
        message: '자녀 ID와 상담사 ID가 필요합니다.',
      });
    }

    // 자녀 정보 확인
    const childQuery = 'SELECT id, name FROM children WHERE id = ? AND is_active = TRUE';
    db.query(childQuery, [child_id], (childErr, childRows) => {
      if (childErr) {
        console.error('자녀 정보 확인 오류:', childErr);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      if (childRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '자녀 정보를 찾을 수 없습니다.',
        });
      }

      // 상담사 정보 확인
      const counselorQuery = 'SELECT counselor_id, name, domain, region FROM counselors WHERE counselor_id = ?';
      db.query(counselorQuery, [counselor_id], (counselorErr, counselorRows) => {
        if (counselorErr) {
          console.error('상담사 정보 확인 오류:', counselorErr);
          return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
          });
        }

        if (counselorRows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '상담사 정보를 찾을 수 없습니다.',
          });
        }

        // 매칭 요청 로그 기록
        console.log('=== 상담사 매칭 요청 ===');
        console.log('자녀 정보:', childRows[0]);
        console.log('상담사 정보:', counselorRows[0]);
        console.log('요청 메시지:', message || '메시지 없음');
        console.log('요청 시간:', new Date().toISOString());
        console.log('========================');

        // 실제 서비스에서는 여기서 매칭 테이블에 저장하거나 
        // 상담사에게 알림을 보내는 로직을 구현할 수 있습니다.

        return res.status(200).json({
          success: true,
          message: '상담사 매칭 요청이 접수되었습니다.',
          data: {
            child: childRows[0],
            counselor: counselorRows[0],
            request_message: message,
            request_time: new Date().toISOString()
          }
        });
      });
    });
  } catch (error) {
    console.error('상담사 매칭 요청 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

module.exports = router;

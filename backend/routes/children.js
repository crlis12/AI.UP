const express = require('express');
const db = require('../db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 프로필 이미지 업로드 설정 (uploads/children)
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'children');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (_) {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const imageOnlyFilter = (req, file, cb) => {
  if ((file.mimetype || '').startsWith('image/')) return cb(null, true);
  return cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
};

const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// 프로필 이미지 업로드 엔드포인트
router.post('/:childId/upload-profile', (req, res) => {
  const childId = req.params.childId;
  
  if (!childId) {
    return res.status(400).json({ success: false, message: '아동 ID가 필요합니다.' });
  }

  uploadProfileImage.single('profile_image')(req, res, (err) => {
    if (err) {
      console.error('프로필 이미지 업로드 오류:', err);
      return res.status(400).json({ success: false, message: err.message || '업로드 실패' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: '업로드할 파일이 없습니다.' });
    }

    const filename = req.file.filename;
    
    // DB에서 해당 자녀의 profile_image 필드 업데이트
    const updateQuery = 'UPDATE children SET profile_image = ? WHERE id = ? AND is_active = TRUE';
    db.query(updateQuery, [filename, childId], (dbErr, result) => {
      if (dbErr) {
        console.error('DB 업데이트 오류:', dbErr);
        return res.status(500).json({ success: false, message: '데이터베이스 업데이트 실패' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '아동 정보를 찾을 수 없습니다.' });
      }

      const relativePath = `/uploads/children/${filename}`;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const absoluteUrl = `${baseUrl}${relativePath}`;
      
      return res.status(200).json({ 
        success: true, 
        message: '프로필 이미지가 성공적으로 업로드되었습니다.',
        url: absoluteUrl, 
        path: relativePath,
        filename: filename
      });
    });
  });
});

// 입력 데이터 유효성 검사 함수
const validateChildData = (data) => {
  const { name, birth_date, parent_id } = data;

  if (!name || name.trim().length < 1) {
    return { valid: false, message: '아동 이름은 필수입니다.' };
  }

  if (!birth_date) {
    return { valid: false, message: '생년월일은 필수입니다.' };
  }

  if (!parent_id) {
    return { valid: false, message: '부모 ID는 필수입니다.' };
  }

  // 생년월일 형식 검증 (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birth_date)) {
    return { valid: false, message: '올바른 날짜 형식을 입력해주세요. (YYYY-MM-DD)' };
  }

  return { valid: true };
};

// 아동 등록
router.post('/register', async (req, res) => {
  try {
    const childData = req.body;

    // 입력 데이터 검증
    const validation = validateChildData(childData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // 부모 존재 여부 확인
    db.query('SELECT id FROM users WHERE id = ?', [childData.parent_id], (err, rows) => {
      if (err) {
        console.error('DB 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '존재하지 않는 부모 사용자입니다.',
        });
      }

      // 아동 정보 DB에 저장
      const {
        parent_id,
        name,
        birth_date,
        gender,
        nickname,
        profile_image,
        height,
        weight,
        development_stage,
        special_needs,
        medical_notes,
        school_name,
        grade_level,
        interests,
        favorite_activities,
        personality_traits,
        learning_style,
        communication_level,
      } = childData;

      const insertQuery = `
        INSERT INTO children (
          parent_id, name, birth_date, gender, nickname, profile_image,
          height, weight, development_stage, special_needs, medical_notes,
          school_name, grade_level, interests, favorite_activities,
          personality_traits, learning_style, communication_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        parent_id,
        name.trim(),
        birth_date,
        gender,
        nickname?.trim(),
        profile_image,
        height,
        weight,
        development_stage,
        special_needs,
        medical_notes,
        school_name,
        grade_level,
        interests,
        favorite_activities,
        personality_traits ? JSON.stringify(personality_traits) : null,
        learning_style,
        communication_level,
      ];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error('DB 저장 오류:', err);
          return res.status(500).json({
            success: false,
            message: '아동 등록 처리 중 오류가 발생했습니다.',
          });
        }

        return res.status(201).json({
          success: true,
          message: '아동 등록이 완료되었습니다.',
          child: {
            id: result.insertId,
            parent_id,
            name: name.trim(),
            birth_date,
            gender,
            nickname: nickname?.trim(),
          },
        });
      });
    });
  } catch (error) {
    console.error('아동 등록 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 특정 부모의 모든 아동 조회
router.get('/parent/:parentId', (req, res) => {
  try {
    const parentId = req.params.parentId;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: '부모 ID가 필요합니다.',
      });
    }

    const query = `
      SELECT 
        id, parent_id, name, birth_date, gender, nickname, profile_image,
        height, weight, development_stage, special_needs, medical_notes,
        school_name, grade_level, interests, favorite_activities,
        personality_traits, learning_style, communication_level,
        created_at, updated_at, is_active
      FROM children 
      WHERE parent_id = ? AND is_active = TRUE
      ORDER BY created_at DESC
    `;

    db.query(query, [parentId], (err, rows) => {
      if (err) {
        console.error('DB 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      // JSON 필드 파싱
      const children = rows.map((child) => ({
        ...child,
        personality_traits: child.personality_traits ? JSON.parse(child.personality_traits) : null,
      }));

      return res.status(200).json({
        success: true,
        children: children,
      });
    });
  } catch (error) {
    console.error('아동 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 특정 아동 상세 조회
router.get('/:childId', (req, res) => {
  try {
    const childId = req.params.childId;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: '아동 ID가 필요합니다.',
      });
    }

    const query = `
      SELECT 
        c.*, u.username as parent_name, u.nickname as parent_nickname
      FROM children c
      LEFT JOIN users u ON c.parent_id = u.id
      WHERE c.id = ? AND c.is_active = TRUE
    `;

    db.query(query, [childId], (err, rows) => {
      if (err) {
        console.error('DB 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '아동 정보를 찾을 수 없습니다.',
        });
      }

      const child = {
        ...rows[0],
        personality_traits: rows[0].personality_traits
          ? JSON.parse(rows[0].personality_traits)
          : null,
      };

      return res.status(200).json({
        success: true,
        child: child,
      });
    });
  } catch (error) {
    console.error('아동 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 아동 정보 수정
router.put('/:childId', async (req, res) => {
  try {
    const childId = req.params.childId;
    const updateData = req.body;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: '아동 ID가 필요합니다.',
      });
    }

    // 아동 존재 여부 확인
    db.query(
      'SELECT id FROM children WHERE id = ? AND is_active = TRUE',
      [childId],
      (err, rows) => {
        if (err) {
          console.error('DB 조회 오류:', err);
          return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
          });
        }

        if (rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '아동 정보를 찾을 수 없습니다.',
          });
        }

        // 업데이트할 필드 동적 생성
        const updateFields = [];
        const updateValues = [];

        const allowedFields = [
          'name',
          'birth_date',
          'gender',
          'nickname',
          'profile_image',
          'height',
          'weight',
          'development_stage',
          'special_needs',
          'medical_notes',
          'school_name',
          'grade_level',
          'interests',
          'favorite_activities',
          'learning_style',
          'communication_level',
        ];

        allowedFields.forEach((field) => {
          if (updateData[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            updateValues.push(updateData[field]);
          }
        });

        // personality_traits는 JSON으로 처리
        if (updateData.personality_traits !== undefined) {
          updateFields.push('personality_traits = ?');
          updateValues.push(JSON.stringify(updateData.personality_traits));
        }

        if (updateFields.length === 0) {
          return res.status(400).json({
            success: false,
            message: '수정할 데이터가 없습니다.',
          });
        }

        updateValues.push(childId);
        const updateQuery = `UPDATE children SET ${updateFields.join(', ')} WHERE id = ?`;

        db.query(updateQuery, updateValues, (err, result) => {
          if (err) {
            console.error('DB 수정 오류:', err);
            return res.status(500).json({
              success: false,
              message: '아동 정보 수정 중 오류가 발생했습니다.',
            });
          }

          return res.status(200).json({
            success: true,
            message: '아동 정보가 성공적으로 수정되었습니다.',
          });
        });
      }
    );
  } catch (error) {
    console.error('아동 정보 수정 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 아동 정보 삭제 (물리 삭제 + 관련 일지 정리)
router.delete('/:childId', (req, res) => {
  try {
    const childId = req.params.childId;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: '아동 ID가 필요합니다.',
      });
    }
    // 트랜잭션으로 관련 데이터 삭제 처리
    db.beginTransaction((txErr) => {
      if (txErr) {
        console.error('트랜잭션 시작 오류:', txErr);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
      }

      const deleteDiariesSql = 'DELETE FROM diaries WHERE child_id = ?';
      db.query(deleteDiariesSql, [childId], (dErr) => {
        if (dErr) {
          console.error('관련 일지 삭제 오류:', dErr);
          return db.rollback(() =>
            res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
          );
        }

        const deleteChildSql = 'DELETE FROM children WHERE id = ?';
        db.query(deleteChildSql, [childId], (cErr, result) => {
          if (cErr) {
            console.error('아동 물리 삭제 오류:', cErr);
            return db.rollback(() =>
              res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
            );
          }
          if (result.affectedRows === 0) {
            return db.rollback(() =>
              res.status(404).json({ success: false, message: '아동 정보를 찾을 수 없습니다.' })
            );
          }
          db.commit((commitErr) => {
            if (commitErr) {
              console.error('트랜잭션 커밋 오류:', commitErr);
              return db.rollback(() =>
                res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
              );
            }
            return res
              .status(200)
              .json({ success: true, message: '아동 정보가 성공적으로 삭제되었습니다.' });
          });
        });
      });
    });
  } catch (error) {
    console.error('아동 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();

// 임시 샘플 데이터 생성 함수
const generateSampleReportData = (childId) => {
  return {
    childId: parseInt(childId),
    assessmentDate: '2024-01-15',
    ageInMonths: 24,
    scores: {
      selfCare: { score: 85, status: '정상', description: '자조 능력' },
      communication: { score: 78, status: '주의', description: '의사소통' },
      grossMotor: { score: 92, status: '정상', description: '대근육운동' },
      fineMotor: { score: 88, status: '정상', description: '소근육운동' },
      problemSolving: { score: 82, status: '정상', description: '문제해결' },
      personalSocial: { score: 75, status: '주의', description: '개인사회성' },
    },
    totalScore: 83,
    overallStatus: '정상',
    recommendations: [
      '의사소통 영역에서 더 많은 상호작용과 대화 시간을 늘려보세요.',
      '개인사회성 발달을 위해 또래와의 놀이 활동을 권장합니다.',
      '전반적으로 양호한 발달 상태를 보이고 있습니다.',
    ],
    nextAssessment: '2024-04-15',
  };
};

// 특정 아동의 리포트 조회
router.get('/:childId', async (req, res) => {
  try {
    const { childId } = req.params;

    // TODO: 실제 데이터베이스에서 child_scores 테이블 조회
    // 현재는 샘플 데이터 반환
    const reportData = generateSampleReportData(childId);

    res.json({
      success: true,
      report: reportData,
    });
  } catch (error) {
    console.error('리포트 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '리포트 조회 중 오류가 발생했습니다.',
    });
  }
});

// 새로운 평가 결과 저장
router.post('/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const {
      ageInMonths,
      assessmentDate,
      selfCareScore,
      communicationScore,
      grossMotorScore,
      fineMotorScore,
      problemSolvingScore,
      personalSocialScore,
      notes,
    } = req.body;

    // TODO: 실제 데이터베이스에 child_scores 테이블에 저장
    // 현재는 성공 응답만 반환

    const totalScore = Math.round(
      (selfCareScore +
        communicationScore +
        grossMotorScore +
        fineMotorScore +
        problemSolvingScore +
        personalSocialScore) /
        6
    );

    let assessmentStatus = '정상';
    if (totalScore < 60) {
      assessmentStatus = '위험';
    } else if (totalScore < 80) {
      assessmentStatus = '주의';
    }

    res.json({
      success: true,
      message: '평가 결과가 저장되었습니다.',
      data: {
        childId: parseInt(childId),
        totalScore,
        assessmentStatus,
      },
    });
  } catch (error) {
    console.error('리포트 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '리포트 저장 중 오류가 발생했습니다.',
    });
  }
});

// 아동의 평가 이력 조회
router.get('/:childId/history', async (req, res) => {
  try {
    const { childId } = req.params;

    // TODO: 실제 데이터베이스에서 해당 아동의 모든 평가 이력 조회
    // 현재는 샘플 데이터 반환
    const historyData = [
      {
        id: 1,
        assessmentDate: '2024-01-15',
        totalScore: 83,
        assessmentStatus: '정상',
      },
      {
        id: 2,
        assessmentDate: '2023-10-15',
        totalScore: 78,
        assessmentStatus: '주의',
      },
    ];

    res.json({
      success: true,
      history: historyData,
    });
  } catch (error) {
    console.error('리포트 이력 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '리포트 이력 조회 중 오류가 발생했습니다.',
    });
  }
});

module.exports = router;

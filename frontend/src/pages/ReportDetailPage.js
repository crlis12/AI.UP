import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiUser,
  FiCalendar,
  FiBarChart2,
} from 'react-icons/fi';
import API_BASE from '../utils/api';
import PageLayout from '../components/PageLayout';

function ReportDetailPage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [childInfo, setChildInfo] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        console.log('자녀 정보 조회 시작, childId:', childId);
        console.log('API_BASE:', API_BASE);

        // 아동 정보 조회
        const childResponse = await fetch(`${API_BASE}/children/${childId}`);
        console.log('자녀 정보 응답 상태:', childResponse.status);

        const childData = await childResponse.json();
        console.log('자녀 정보 응답 데이터:', childData);

        if (childData.success) {
          setChildInfo(childData.child);
          console.log('자녀 정보 설정 완료:', childData.child);
        } else {
          console.error('자녀 정보 조회 실패:', childData.message);
          // 자녀 정보가 없어도 기본값으로 설정하여 리포트는 표시
          const currentDate = new Date();
          const defaultBirthDate = new Date(currentDate.getFullYear() - 2, 0, 1).toISOString().split('T')[0]; // 2년 전
          setChildInfo({
            id: childId,
            name: '자녀',
            birth_date: defaultBirthDate,
          });
        }

        // 리포트 데이터 조회 (실제 API 엔드포인트는 백엔드 구현에 따라 수정 필요)
        console.log('리포트 데이터 조회 시작');
        const reportResponse = await fetch(`${API_BASE}/reports/${childId}`);
        console.log('리포트 응답 상태:', reportResponse.status);

        const reportResult = await reportResponse.json();
        console.log('리포트 응답 데이터:', reportResult);

        if (reportResult.success) {
          setReportData(reportResult.report);
        } else {
          // 샘플 데이터 (실제 데이터가 없을 경우)
          console.log('리포트 데이터 없음, 샘플 데이터 사용');
          setReportData(generateSampleData());
        }
      } catch (error) {
        console.error('리포트 데이터 조회 중 오류:', error);
        setError('리포트 데이터를 불러오는데 실패했습니다.');
        // 에러 시에도 샘플 데이터 표시
        setReportData(generateSampleData());
      } finally {
        setLoading(false);
      }
    };

    if (childId) {
      fetchReportData();
    } else {
      console.error('childId가 없습니다');
      setError('자녀 ID가 없습니다.');
      setLoading(false);
    }
  }, [childId]);

  // 샘플 데이터 생성 함수
  const generateSampleData = () => {
    return {
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

  const getStatusColor = (status) => {
    switch (status) {
      case '정상':
        return '#28a745';
      case '주의':
        return '#ffc107';
      case '위험':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case '정상':
        return <FiCheckCircle />;
      case '주의':
        return <FiAlertTriangle />;
      case '위험':
        return <FiAlertTriangle />;
      default:
        return <FiBarChart2 />;
    }
  };

  const calculateAge = (ageInMonths) => {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return years > 0 ? `${years}세 ${months}개월` : `${months}개월`;
  };

  // 생년월일로부터 나이 계산 함수
  const calculateAgeFromBirthDate = (birthDate) => {
    if (!birthDate) return '나이 정보 없음';
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // 일까지 고려하여 정확한 개월 수 계산
    if (today.getDate() < birth.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }
    
    return years > 0 ? `${years}세 ${months}개월` : `${months}개월`;
  };

  // 현재 날짜를 평가일로 사용
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  };

  // 체크리스트 항목 생성 (영역 상태 기반 간단 추천)
  const buildChecklistItems = (scores) => {
    const defaultItems = [
      '다른 아이들과 어울려 노는 것을 즐기나요?',
      '다른 아이의 행동에 대해 이야기하나요?',
      '자신의 기분을 즐겁거나 나쁘다고 말하나요?',
    ];
    if (!scores) return defaultItems;
    const priority = Object.entries(scores).find(
      ([, v]) => v.status === '주의' || v.status === '위험'
    );
    if (!priority) return defaultItems;
    const [key] = priority;
    const domainBased = {
      communication: [
        '일상 속에서 아이에게 선택지를 주고 대답을 기다려주나요?',
        '아이가 말한 단어를 확장해 다시 말해주나요?',
        '노래나 동화로 새로운 단어를 접하게 하나요?',
      ],
      personalSocial: [
        '다른 아이들과 함께하는 역할놀이를 시도해보셨나요?',
        '차례 기다리기, 양보하기를 놀이로 연습하나요?',
        '하루 중 긍정 경험을 함께 이야기하나요?',
      ],
      selfCare: [
        '스스로 해볼 기회를 충분히 주고 있나요?',
        '일과표로 일상 루틴을 시각화해 주나요?',
        '성공했을 때 바로 칭찬해 주나요?',
      ],
    };
    return domainBased[key] || defaultItems;
  };

  const buildChecklistHeadline = (scores) => {
    if (!scores) return '현재 발달 영역에서 가이드가 필요합니다.';
    const target = Object.entries(scores).find(
      ([, v]) => v.status === '주의' || v.status === '위험'
    );
    if (!target) return '전반적으로 양호해요. 일상 속 체크리스트로 꾸준히 도와주세요.';
    const [, data] = target;
    return `현재 ${data.description} 영역에서 가이드가 필요합니다.`;
  };

  const buildAlertMessage = (scores) => {
    if (!scores) return null;
    const target = Object.entries(scores).find(
      ([, v]) => v.status === '주의' || v.status === '위험'
    );
    if (!target) return null;
    const [, data] = target;
    return `${data.description} 영역에서 또래와의 발달이 ${data.status === '위험' ? '많이' : '다소'} 느려요. 전문가와 상담을 받아보는 건 어떨까요?`;
  };

  const titleStyle = { fontSize: '16px', color: '#000000', fontWeight: 'bold' };

  if (loading) {
    return (
      <PageLayout title="리포트" titleStyle={titleStyle} showNavBar={true} backTo="/main">
        <div className="loading-container">
          <div className="loading-text">리포트를 불러오는 중...</div>
        </div>
      </PageLayout>
    );
  }

  if (error && !reportData) {
    return (
      <PageLayout title="리포트" titleStyle={titleStyle} showNavBar={true} backTo="/main">
        <div className="error-container">
          <div className="error-text">{error}</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="리포트" titleStyle={titleStyle} showNavBar={true} backTo="/main">
      <div className="report-detail__content">
        {/* 아동 정보 헤더 */}
        <div className="report-detail__header">
          <div className="report-header-info">
            <h1 className="report-detail__title">발달 평가 리포트</h1>
            <div className="report-child-info">
              <div className="child-info-item">
                <FiUser className="info-icon" />
                <span>{childInfo?.name || '아동'}</span>
              </div>
              <div className="child-info-item">
                <FiCalendar className="info-icon" />
                <span>{calculateAgeFromBirthDate(childInfo?.birth_date)}</span>
              </div>
              <div className="child-info-item">
                <FiBarChart2 className="info-icon" />
                <span>평가일: {getCurrentDate()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 전체 점수 카드 */}
        <div className="report-summary-card">
          <div className="summary-score-container">
            <div className="total-score">
              <span className="score-number">{reportData?.totalScore}</span>
              <span className="score-label">점</span>
            </div>
            <div className="overall-status">
              <div
                className="status-badge"
                style={{ backgroundColor: getStatusColor(reportData?.overallStatus) }}
              >
                {getStatusIcon(reportData?.overallStatus)}
                <span>{reportData?.overallStatus}</span>
              </div>
            </div>
          </div>
          <div className="summary-description">
            <p>
              전반적인 발달 상태가 <strong>{reportData?.overallStatus}</strong> 범위에 있습니다.
            </p>
          </div>
        </div>

        {/* 영역별 점수 */}
        <div className="report-scores-section">
          <h2 className="section-title">
            <FiTrendingUp className="section-icon" />
            영역별 발달 점수
          </h2>
          <div className="scores-grid">
            {Object.entries(reportData?.scores || {}).map(([key, data]) => (
              <div key={key} className="score-card">
                <div className="score-card-header">
                  <h3 className="score-domain">{data.description}</h3>
                  <div className="score-status" style={{ color: getStatusColor(data.status) }}>
                    {getStatusIcon(data.status)}
                    <span>{data.status}</span>
                  </div>
                </div>
                <div className="score-value">
                  <span className="score-number">{data.score}</span>
                  <span className="score-max">/100</span>
                </div>
                <div className="score-progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${data.score}%`,
                      backgroundColor: getStatusColor(data.status),
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우리 아이에게 필요한 체크리스트 */}
        <div className="report-checklist-section">
          <h2 className="section-title">우리 아이에게 필요한 체크리스트</h2>
          <p className="checklist-headline">{buildChecklistHeadline(reportData?.scores)}</p>
          <div className="checklist-card">
            {buildChecklistItems(reportData?.scores).map((text, idx) => (
              <button key={idx} type="button" className="checklist-item">
                <span className="checklist-item__icon">
                  <FiUser />
                </span>
                <span className="checklist-item__text">{text}</span>
              </button>
            ))}
            <button
              type="button"
              className="checklist-more-link"
              onClick={() => navigate('/kdst-checklist', { state: { childId } })}
            >
              K-DST 발달 체크리스트 더보기
            </button>
          </div>

          {buildAlertMessage(reportData?.scores) && (
            <div className="checklist-alert">{buildAlertMessage(reportData?.scores)}</div>
          )}

          <button
            type="button"
            className="connect-counselor-button"
            onClick={() => navigate('/counselor-matching', { 
              state: { 
                childId: childId, 
                childName: childInfo?.name || '자녀' 
              } 
            })}
          >
            상담사 연결하기
          </button>
        </div>

        {/* 권장사항 */}
        <div className="report-recommendations-section">
          <h2 className="section-title">
            <FiCheckCircle className="section-icon" />
            발달 권장사항
          </h2>
          <div className="recommendations-list">
            {reportData?.recommendations?.map((recommendation, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-number">{index + 1}</div>
                <p className="recommendation-text">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 다음 평가 안내 */}
        <div className="report-next-assessment">
          <div className="next-assessment-card">
            <div className="next-assessment-icon">
              <FiCalendar />
            </div>
            <div className="next-assessment-info">
              <h3>다음 평가 권장일</h3>
              <p className="next-date">{reportData?.nextAssessment}</p>
              <p className="next-description">
                정기적인 발달 평가를 통해 아이의 성장을 지속적으로 관찰해보세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default ReportDetailPage;

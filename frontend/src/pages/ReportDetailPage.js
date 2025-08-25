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
  const [hasReportData, setHasReportData] = useState(false);
  const [weeklyAverages, setWeeklyAverages] = useState([]);
  const [showGenerateScreen, setShowGenerateScreen] = useState(true);

  // 주차별 평균 점수 간단 라인 차트 (SVG)
  const WeeklyAverageChart = ({ data }) => {
    const series = Array.isArray(data) ? data : [];
    if (series.length === 0) {
      return (
        <div className="weekly-trend-empty">주차별 데이터가 없습니다.</div>
      );
    }

    const paddingX = 6;
    const paddingY = 10; // 상하 간격 더 축소
    const height = 140; // 박스(차트) 세로 크기 약간 확장
    const stepX = 48; // 포인트 간 간격 축소
    const intervals = Math.max((series.length - 1), 4); // 최소 5주(4간격) 뷰포트
    const innerWidth = intervals * stepX;
    const width = paddingX + innerWidth + paddingX + 20; // 마지막 주차 우측 여백 축소
    const ticks = [0, 20, 40, 60, 80, 100];

    const toPercent = (v) => {
      const n = Number(v);
      if (!isFinite(n)) return 0;
      if (n <= 0) return 0;
      // 평균 점수가 0~24 범위일 수 있으므로 24 기준으로 백분율 환산
      if (n <= 24) return Math.min(100, (n / 24) * 100);
      // 이미 0~100 스케일이라고 판단되면 그대로 사용
      return Math.min(100, n);
    };

    const xStart = paddingX;
    const xEnd = xStart + innerWidth;

    const getX = (index) => {
      return xStart + stepX * index;
    };
    const getYFromPercent = (p) => {
      const usableHeight = height - paddingY * 2;
      const v = Math.max(0, Math.min(100, Number(p) || 0));
      return paddingY + usableHeight * (1 - v / 100);
    };

    const points = series
      .map((d, i) => `${getX(i)},${getYFromPercent(toPercent(d.value))}`)
      .join(' ');

    return (
              <div className="weekly-trend-chart">
          <div className="weekly-trend-inner" style={{ height: 180 }}>
            <div className="weekly-trend-ycol" style={{ height: 180 }}>
              {ticks.map((t) => (
                <div key={t} className="weekly-trend-ylabel" style={{ top: getYFromPercent(t) - 5 }}>{t}</div>
              ))}
            </div>
            <div className="weekly-trend-xscroll">
              <svg viewBox={`0 0 ${width} ${height + 40}`} width={`${width}px`} height="180">
                <g transform="translate(0,-6)">
                {ticks.map((t) => {
                  const y = getYFromPercent(t);
                  return (
                    <line key={t} x1={0} x2={xEnd} y1={y} y2={y} className="weekly-trend-grid" />
                  );
                })}
                <polyline points={points} fill="none" stroke="#056125" strokeWidth="2" />
                {series.map((d, i) => (
                  <circle key={i} cx={getX(i)} cy={getYFromPercent(toPercent(d.value))} r="3.5" className="weekly-trend-dot" />
                ))}
                                 {series.map((d, i) => (
                   <text key={`x-${i}`} x={getX(i)} y={height + 10} textAnchor="middle" className="weekly-trend-xtext">{`${d.week}주`}</text>
                 ))}
              </g>
            </svg>
          </div>
        </div>
      </div>
    );
  };

  // 리포트 데이터를 데이터베이스에 저장하는 함수
  const saveReportToDatabase = async (agentReport, transformedData) => {
    try {
      console.log('리포트 DB 저장 시작');
      console.log('원본 agentReport:', agentReport);
      console.log('변환된 데이터:', transformedData);

      // 현재 사용자 정보 가져오기
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.id) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // 점수 데이터 추출 (null -> 0 변환)
      const scores = transformedData?.scores || {};
      const nullToZero = (value) => (value === null || value === undefined || isNaN(value)) ? 0 : Number(value);

      // checklist-alert 메시지 추출 (finalOpinionText 또는 buildAlertMessage 결과)
      const alertMessage = transformedData?.finalOpinionText || buildAlertMessage(transformedData?.scores) || null;

      const reportData = {
        parent_id: currentUser.id,
        child_id: parseInt(childId),
        gross_motor_score: nullToZero(scores.grossMotor?.score24),
        fine_motor_score: nullToZero(scores.fineMotor?.score24),
        cognitive_score: nullToZero(scores.problemSolving?.score24),
        language_score: nullToZero(scores.communication?.score24),
        social_score: nullToZero(scores.personalSocial?.score24),
        self_help_score: nullToZero(scores.selfCare?.score24),
        additional_question: nullToZero(transformedData?.extraQuestions?.total),
        alert_message: alertMessage,
        week_number: null // 자동 계산되도록 null로 설정
      };

      console.log('저장할 리포트 데이터:', reportData);

      const response = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '리포트 저장에 실패했습니다.');
      }

      console.log('리포트 DB 저장 성공:', result);
      return result;
    } catch (error) {
      console.error('리포트 DB 저장 오류:', error);
      throw error;
    }
  };

  // 데이터베이스 리포트 데이터를 UI 형식으로 변환하는 함수
  const transformDatabaseReportToUI = (dbReport, childInfo) => {
    try {
      console.log('DB 리포트를 UI 형식으로 변환:', dbReport);

      // 점수를 백분율로 변환 (각 영역 최대 점수를 가정)
      // KDST에서 각 영역별 최대 점수는 보통 다르지만, 여기서는 간단히 처리
      const calculatePercent = (score, maxScore = 24) => {
        if (!score || score === 0) return 0;
        return Math.min(100, Math.round((score / maxScore) * 100));
      };

      const getStatus = (percent) => {
        if (percent === 0) return '정보없음';
        if (percent < 60) return '위험';
        if (percent < 80) return '주의';
        return '정상';
      };

      // 각 영역별 점수와 상태 계산
      const scores = {
        grossMotor: {
          score24: dbReport.gross_motor_score || 0,
          percent: calculatePercent(dbReport.gross_motor_score),
          status: getStatus(calculatePercent(dbReport.gross_motor_score)),
          description: '대근육운동',
          outOf: dbReport.gross_motor_score ? 24 : 24
        },
        fineMotor: {
          score24: dbReport.fine_motor_score || 0,
          percent: calculatePercent(dbReport.fine_motor_score),
          status: getStatus(calculatePercent(dbReport.fine_motor_score)),
          description: '소근육운동',
          outOf: dbReport.fine_motor_score ? 24 : 24
        },
        problemSolving: {
          score24: dbReport.cognitive_score || 0,
          percent: calculatePercent(dbReport.cognitive_score),
          status: getStatus(calculatePercent(dbReport.cognitive_score)),
          description: '인지',
          outOf: dbReport.cognitive_score ? 24 : 24
        },
        communication: {
          score24: dbReport.language_score || 0,
          percent: calculatePercent(dbReport.language_score),
          status: getStatus(calculatePercent(dbReport.language_score)),
          description: '언어',
          outOf: dbReport.language_score ? 24 : 24
        },
        personalSocial: {
          score24: dbReport.social_score || 0,
          percent: calculatePercent(dbReport.social_score),
          status: getStatus(calculatePercent(dbReport.social_score)),
          description: '사회성',
          outOf: dbReport.social_score ? 24 : 24
        },
        selfCare: {
          score24: dbReport.self_help_score || 0,
          percent: calculatePercent(dbReport.self_help_score),
          status: getStatus(calculatePercent(dbReport.self_help_score)),
          description: '자조',
          outOf: dbReport.self_help_score ? 24 : 24
        }
      };

      // 전체 점수 계산
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score.score24, 0);
      const totalMaxScore = Object.values(scores).reduce((sum, score) => sum + (score.outOf || 0), 0);
      const overallPercent = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      const overallStatus = getStatus(overallPercent);

      // 자녀 나이 계산
      const calculateAgeInMonths = (birthDate) => {
        if (!birthDate) return '정보 없음';
        const today = new Date();
        const birth = new Date(birthDate);
        const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        return months > 0 ? months : '정보 없음';
      };

      // 리포트 날짜 포맷팅
      const formatReportDate = (dateString) => {
        if (!dateString) return getCurrentDate();
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // 다음 평가일 계산 (리포트 날짜 + 7일) - 현재 이거 사용중
      const calculateNextAssessment = (reportDate) => {
        const date = new Date(reportDate || Date.now());
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
      };

      return {
        assessmentDate: formatReportDate(dbReport.report_date),
        ageInMonths: calculateAgeInMonths(childInfo?.birth_date),
        scores: scores,
        totalScore: totalScore,
        overallStatus: overallStatus,
        recommendations: [
          '정기적인 발달 검사를 통해 자녀의 성장을 지속적으로 모니터링하세요.',
          '각 발달 영역에서 부족한 부분이 있다면 전문가와 상담해보세요.',
          '일상생활에서 다양한 활동을 통해 균형잡힌 발달을 도와주세요.'
        ],
        nextAssessment: calculateNextAssessment(dbReport.report_date),
        finalOpinionText: dbReport.alert_message || `전체적으로 ${overallStatus} 수준의 발달을 보이고 있습니다.`,
        finalIsWarning: overallPercent < 60,
        extraQuestions: {
          status: (dbReport.additional_question || 0) > 0 ? '경고' : '문제없음',
          total: dbReport.additional_question || 0
        },
        weekNumber: dbReport.week_number || 1 // 주차 정보 추가
      };
    } catch (error) {
      console.error('DB 리포트 변환 오류:', error);
      return null;
    }
  };

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

        // 데이터베이스에서 리포트 데이터 조회
        console.log('데이터베이스에서 리포트 데이터 조회 시작');
        try {
          const reportResponse = await fetch(`${API_BASE}/reports/child/${childId}`);
          console.log('리포트 데이터 응답 상태:', reportResponse.status);
          
          const reportData = await reportResponse.json();
          console.log('리포트 데이터 응답:', reportData);

          if (reportData.success && reportData.reports && reportData.reports.length > 0) {
            // 주차별 평균 점수 시리즈 구성
            const trend = [...reportData.reports]
              .filter((r) => r && r.week_number != null && r.average_score != null)
              .sort((a, b) => (Number(a.week_number || 0) - Number(b.week_number || 0)))
              .map((r) => ({ week: Number(r.week_number), value: Number(r.average_score) }));
            setWeeklyAverages(trend);

            // 가장 최신 리포트 사용
            const latestReport = reportData.reports[0];
            console.log('최신 리포트 데이터:', latestReport);
            
            // DB 데이터를 UI 형식으로 변환
            const uiData = transformDatabaseReportToUI(latestReport, childData.child);
            if (uiData) {
              setReportData(uiData);
              setHasReportData(true);
              console.log('DB 리포트 데이터를 UI에 적용 완료');
            } else {
              console.log('DB 리포트 변환 실패, 리포트 생성 화면 표시');
              setHasReportData(false);
            }
          } else {
            console.log('저장된 리포트가 없음, 리포트 생성 화면 표시');
            setHasReportData(false);
          }
        } catch (reportError) {
          console.error('리포트 데이터 조회 오류:', reportError);
          console.log('리포트 조회 실패, 샘플 데이터 사용');
          setReportData(transformAgentReportToUI(SAMPLE_AGENT_REPORT));
        }
      } catch (error) {
        console.error('리포트 데이터 조회 중 오류:', error);
        setError('리포트 데이터를 불러오는데 실패했습니다.');
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

  // ReportAgent 스키마 → UI 스키마 변환 함수
  const transformAgentReportToUI = (agentReport) => {
    try {
      const domains = Array.isArray(agentReport?.domains) ? agentReport.domains : [];

      // 도메인명 → 내부 키 매핑
      const mapDomainNameToKey = (name) => {
        const normalized = String(name || '').replace(/\s|-/g, '');
        if (normalized.includes('대근육')) return 'grossMotor';
        if (normalized.includes('소근육')) return 'fineMotor';
        if (normalized.includes('인지')) return 'problemSolving';
        if (normalized.includes('언어')) return 'communication';
        if (normalized.includes('사회')) return 'personalSocial';
        if (normalized.includes('자조')) return 'selfCare';
        return null;
      };

      const scoresByKey = {};
      let totalNumerator = 0;   // 각 도메인 합산 점수 (null은 0)
      let totalDenominator = 0; // 각 도메인 분모 합 (null이 아닌 항목 수 * 3)

      let extraQuestionsScore = 0; // domain_id 6 합계
      for (const d of domains) {
        const key = mapDomainNameToKey(d?.domain_name);
        const questions = Array.isArray(d?.questions) ? d.questions : [];

        // 추가질문: domain_id 6 처리 (점수 표기로는 사용하지 않음)
        if (Number(d?.domain_id) === 6) {
          extraQuestionsScore = questions.reduce((acc, q) => acc + (q?.score == null ? 0 : Number(q.score)), 0);
          continue;
        }

        if (!key) continue; // UI에 없는 도메인은 스킵
        const rawSum = questions.reduce((acc, q) => acc + (q?.score == null ? 0 : Number(q.score)), 0);
        const denom = questions.reduce((acc, q) => acc + (q?.score == null ? 0 : 3), 0); // non-null 개수 * 3
        const percent = denom > 0 ? Math.round((rawSum / denom) * 100) : 0;
        const status = denom === 0 ? '정보없음' : percent < 60 ? '위험' : percent < 80 ? '주의' : '정상';

        scoresByKey[key] = {
          score24: rawSum,
          percent,
          status,
          description: d?.domain_name || '',
          outOf: denom
        };

        totalNumerator += rawSum;
        totalDenominator += denom;
      }

      const totalSumOutOf24 = totalNumerator; // 추가질문 제외 5개 도메인 합산 점수
      const overallPercent = totalDenominator > 0 ? Math.round((totalNumerator / totalDenominator) * 100) : 0;
      const overallStatus = overallPercent < 60 ? '위험' : overallPercent < 80 ? '주의' : '정상';

      // 자조(selfCare)가 아예 없을 수 있음 → 없으면 0/0으로 표기할 수 있게 플레이스홀더 생성
      if (!scoresByKey.selfCare) {
        scoresByKey.selfCare = {
          score24: 0,
          percent: 0,
          status: '정보없음',
          description: '자조',
          outOf: 0
        };
      }

      // 권장사항: requirements만 사용 (opinion_text는 경고 배너에서만 표시)
      const opinionText = agentReport?.final_opinion?.opinion_text || '';
      const recommendations = Array.isArray(agentReport?.final_opinion?.requirements)
        ? agentReport.final_opinion.requirements
        : [];

      // 다음 평가일: 오늘 기준 + 7일
      const next = new Date();
      next.setDate(next.getDate() + 7);
      const nextAssessment = next.toISOString().split('T')[0];

      return {
        assessmentDate: getCurrentDate(),
        ageInMonths: agentReport?.child_age_month || '정보 없음',
        scores: scoresByKey,
        totalScore: totalSumOutOf24,
        overallStatus,
        recommendations,
        nextAssessment,
        finalOpinionText: opinionText,
        finalIsWarning: agentReport?.final_opinion?.isWarning ?? null,
        extraQuestions: {
          status: extraQuestionsScore > 0 ? '경고' : '문제없음',
          total: extraQuestionsScore
        }
      };
    } catch (e) {
      console.error('ReportAgent 결과 변환 오류:', e);
      return null;
    }
  };

  // 제공된 ReportAgent 샘플 데이터 (null은 0으로 계산)
  const SAMPLE_AGENT_REPORT = {
    child_age_month: '정보 없음',
    child_name: '하이',
    domains: [
      {
        domain_id: 1,
        domain_name: '대근육 운동',
        questions: [
          { question: '등을 대고 누운 자세에서 반쯤 뒤집는다.', question_number: 1, score: 3 },
          { question: '엎드려 놓으면 고개를 잠깐 들었다 내린다.', question_number: 2, score: 3 },
          { question: '누운 자세에서 두 팔을 잡고 일으켜 앉힐 때 목이 뒤로 쳐지지 않고 따라 올라온다.', question_number: 3, score: 3 },
          { question: '엎드린 자세에서 가슴을 들고 양팔로 버틴다.', question_number: 4, score: 3 },
          { question: '엎드린 자세에서 뒤집는다.', question_number: 5, score: 3 },
          { question: '등을 대고 누운 자세에서 엎드린 자세로 뒤집는다', question_number: 6, score: 3 },
          { question: '누워 있을 때 자기 발을 잡고 논다.', question_number: 7, score: 3 },
          { question: '앉혀주면 양손을 짚고 30초 이상 혼자 버티고 앉아 있다.', question_number: 8, score: 3 }
        ]
      },
      {
        domain_id: 2,
        domain_name: '소근육 운동',
        questions: [
          { question: '등을 대고 누운 자세에서 두 손을 가슴 부분에 모은다.', question_number: 9, score: 3 },
          { question: '손에 딸랑이를 쥐여 주면 잠시 쥐고 있다.', question_number: 10, score: 3 },
          { question: '앉은 자세로 안겨있을 때 양손을 모아 쥐거나 손가락을 만진다.', question_number: 11, score: 3 },
          { question: '손에 쥐고 있는 딸랑이를 자기 입으로 가져간다.', question_number: 12, score: 3 },
          { question: '딸랑이를 손 가까이 주면 잡는다.', question_number: 13, score: 3 },
          { question: '앉은 자세로 안겨있을 때 탁자 위의 장난감을 향해 손을 뻗는다', question_number: 14, score: 3 },
          { question: '작은 장난감을 집어들 때, 손바닥에 대고 손가락으로 감싸 쥔다.', question_number: 15, score: 3 },
          { question: '딸랑이를 쥐고 있는 손에 다른 장난감을 주면 쥐고 있던 딸랑이를 떨어뜨리고 새 장난감을 잡는다.', question_number: 16, score: 3 }
        ]
      },
      {
        domain_id: 3,
        domain_name: '인지',
        questions: [
          { question: '소리 나는 곳을 쳐다본다.', question_number: 17, score: null },
          { question: '눈앞에서 장난감을 움직이면 시선이 장난감의 움직임을 따라간다.', question_number: 18, score: null },
          { question: '어떤 소리를 듣고 있다가 새로운 소리가 들리면 거기로 관심을 돌린다.', question_number: 19, score: null },
          { question: '자기 손과 손가락을 자세히 바라본다.', question_number: 20, score: null },
          { question: '딸랑이를 흔들거나 바라보거나 입에 넣는 등 딸랑이를 가지고 논다.', question_number: 21, score: null },
          { question: '딸랑이나 숟가락과 같은 물건을 바닥에 두드리면서 논다.', question_number: 22, score: 3 },
          { question: '장난감이 떨어져 있는 곳을 쳐다본다.', question_number: 23, score: null }
        ]
      },
      {
        domain_id: 4,
        domain_name: '언어',
        questions: [
          { question: '"아", "우", "이" 등 의미 없는 발성을 한다.', question_number: 25, score: null },
          { question: '아이를 어르거나 달래면 옹알이로 반응한다.', question_number: 26, score: null },
          { question: '웃을 때 소리를 내며 웃는다.', question_number: 27, score: null },
          { question: '장난감이나 사람을 보고 소리를 내어 반응한다.', question_number: 28, score: null },
          { question: '두 입술을 떨어서 내는 투레질 소리', question_number: 29, score: null },
          { question: '"브", "쁘", "프", "므"와 비슷한 소리를 낸다.', question_number: 30, score: null },
          { question: '"엄마" 또는 "아빠"와 비슷한 소리를 낸다', question_number: 31, score: null },
          { question: '아이에게 "안돼요."라고 하면, 짧은 순간이라도 하던 행동을 멈추고 목소리에 반응한다.', question_number: 32, score: null }
        ]
      },
      {
        domain_id: 5,
        domain_name: '사회-정서',
        questions: [
          { question: '친숙한 어른이 안으려고 하면 팔을 벌린다.', question_number: 24, score: null },
          { question: '엄마(보호자)가 자리를 비웠다가 다시 나타나면 엄마(보호자)를 알아보고 울음을 그친다.', question_number: 33, score: null },
          { question: '아이가 엄마(보호자)와 이야기를 하거나 놀 때 엄마(보호자)의 얼굴을 바라본다.', question_number: 34, score: null },
          { question: '어른이 아이를 보며 말하거나 웃기 전에, 어른을 보고 먼저 웃는다.', question_number: 35, score: null },
          { question: '어른들의 얼굴(머리카락, 코, 안경 등)을 만져보거나 잡아당긴다.', question_number: 36, score: null },
          { question: '거울 속에 보이는 자신의 모습을 보고 웃거나 웅얼거린다.', question_number: 37, score: null },
          { question: '아이의 이름을 부르면 듣고 쳐다본다.', question_number: 38, score: null },
          { question: '가족 등 친숙한 사람을 보면 다가가려고 한다.', question_number: 39, score: 3 },
          { question: '낯가림을 한다', question_number: 40, score: null }
        ]
      }
    ],
    final_opinion: {
      isWarning: null,
      opinion_text:
        '육아일기 내용을 바탕으로 하이의 발달 상황을 살펴보았습니다. 일기에 기록된 \"혼자 걷기\", \"숟가락 사용 시도\" 등의 모습을 볼 때, 하이의 대근육과 소근육 발달은 매우 훌륭하게 이루어지고 있는 것으로 보입니다. 현재 아이의 발달 수준이 검사 문항이 대상으로 하는 시기(생후 4~6개월)보다 훨씬 앞서 있기 때문에, 대근육 및 소근육 관련 항목들은 모두 \"잘 할 수 있다\"로 평가되었습니다. 다만, 현재 육아일기 내용만으로는 인지, 언어, 사회-정서 발달 영역을 정확히 평가하기에는 정보가 다소 부족합니다. 아이의 전반적인 발달 상황을 더 잘 이해하기 위해서는 아래 \"요구사항\"에 제안된 내용들을 관찰하여 일기에 꾸준히 기록해주시는 것이 큰 도움이 될 것입니다.',
      requirements: [
        '언어 발달: 아이가 어떤 소리를 내는지, 예를 들어 \"마마\", \"바바\" 같은 옹알이나 의미 있는 단어를 말하려 하는지, 이름을 불렀을 때 반응하는지 등을 기록해주세요.',
        '인지 발달: 장난감을 가지고 어떻게 노는지(예: 숨기면 찾으려 하는지, 블록 쌓기 등), \"까꿍 놀이\"에 어떻게 반응하는지 등을 구체적으로 적어주시면 좋습니다.',
        '사회-정서 발달: 낯선 사람에 대한 반응(낯가림), 부모님과 눈을 맞추고 상호작용하는 모습, 거울 속 자신을 보고 보이는 반응 등을 관찰하여 기록해주세요.'
      ]
    }
  };

  // 사용자가 요청한 즉시 표시용 샘플 데이터
  const INSTANT_SAMPLE_AGENT_REPORT = {
    child_age_month: '5',
    child_name: '쭈니',
    domains: [
      {
        domain_id: 1,
        domain_name: '대근육운동',
        questions: [
          { question: '등을 대고 누운 자세에서 반쯤 뒤집는다.', question_number: 1, reason: '옆으로 몸을 비트는 시도는 있었으나, 반쯤 뒤집는 동작을 완성하지는 못했습니다.', score: 1 },
          { question: '엎드려 놓으면 고개를 잠깐 들었다 내린다.', question_number: 2, reason: '엎드린 자세에서 잠깐 고개를 들 수 있지만, 오래 버티지 못하고 힘들어합니다.', score: 2 },
          { question: '누운 자세에서 두 팔을 잡고 일으켜 앉힐 때 목이 뒤로 쳐지지 않고 따라 올라온다.', question_number: 3, reason: '일기 전반에 걸쳐 목을 제대로 가누지 못하고 불안정하다는 내용이 반복적으로 언급됩니다.', score: 1 },
          { question: '엎드린 자세에서 가슴을 들고 양팔로 버틴다.', question_number: 4, reason: '팔로 버티려는 시도는 있으나, 아주 잠깐이며 곧 힘들어하며 웁니다.', score: 1 },
          { question: '엎드린 자세에서 뒤집는다.', question_number: 5, reason: '엎드린 자세를 힘들어하며, 뒤집는다는 기록이 전혀 없습니다.', score: 0 },
          { question: '등을 대고 누운 자세에서 엎드린 자세로 뒤집는다', question_number: 6, reason: '뒤집으려는 시도조차 하지 않는다는 내용이 일기에 명확히 기록되어 있습니다.', score: 0 },
          { question: '누워 있을 때 자기 발을 잡고 논다.', question_number: 7, reason: '자료 부족', score: 0 },
          { question: '앉혀주면 양손을 짚고 30초 이상 혼자 버티고 앉아 있다.', question_number: 8, reason: '목 가누기도 불안정한 상태로, 앉는 것에 대한 기록이 전혀 없습니다.', score: 0 }
        ]
      },
      {
        domain_id: 2,
        domain_name: '소근육운동',
        questions: [
          { question: '등을 대고 누운 자세에서 두 손을 가슴 부분에 모은다.', question_number: 9, reason: '손으로 자기 얼굴을 만지며 노는 것으로 보아, 양손을 몸 중앙으로 모으는 동작이 가능합니다.', score: 3 },
          { question: '손에 딸랑이를 쥐여 주면 잠시 쥐고 있다.', question_number: 10, reason: '장난감을 능숙하게 쥐고 흔들며 놀 수 있다는 기록이 있습니다.', score: 3 },
          { question: '앉은 자세로 안겨있을 때 양손을 모아 쥐거나 손가락을 만진다.', question_number: 11, reason: '자료 부족', score: 0 },
          { question: '손에 쥐고 있는 딸랑이를 자기 입으로 가져간다.', question_number: 12, reason: '자료 부족', score: 0 },
          { question: '딸랑이를 손 가까이 주면 잡는다.', question_number: 13, reason: '장난감을 주면 손을 뻗어 잡으려고 한다는 기록이 있습니다.', score: 3 },
          { question: '앉은 자세로 안겨있을 때 탁자 위의 장난감을 향해 손을 뻗는다', question_number: 14, reason: '장난감을 향해 손을 뻗는 것은 가능하지만, 앉은 자세에서 특정 상황에 대한 기록은 부족합니다.', score: 2 },
          { question: '작은 장난감을 집어들 때, 손바닥에 대고 손가락으로 감싸 쥔다.', question_number: 15, reason: '장난감을 능숙하게 쥘 수 있다는 기록으로 보아, 손바닥과 손가락을 이용한 잡기가 가능합니다.', score: 3 },
          { question: '딸랑이를 쥐고 있는 손에 다른 장난감을 주면 쥐고 있던 딸랑이를 떨어뜨리고 새 장난감을 잡는다.', question_number: 16, reason: '자료 부족', score: 0 }
        ]
      },
      {
        domain_id: 3,
        domain_name: '인지',
        questions: [
          { question: '소리 나는 곳을 쳐다본다.', question_number: 17, reason: '소리에 잘 반응한다는 내용이 반복적으로 기록되어 있습니다.', score: 3 },
          { question: '눈앞에서 장난감을 움직이면 시선이 장난감의 움직임을 따라간다.', question_number: 18, reason: '움직이는 장난감을 향해 손을 뻗는 것으로 보아, 시선으로 움직임을 따라가는 것이 가능합니다.', score: 3 },
          { question: '어떤 소리를 듣고 있다가 새로운 소리가 들리면 거기로 관심을 돌린다.', question_number: 19, reason: '자료 부족', score: 0 },
          { question: '자기 손과 손가락을 자세히 바라본다.', question_number: 20, reason: '자료 부족', score: 0 },
          { question: '딸랑이를 흔들거나 바라보거나 입에 넣는 등 딸랑이를 가지고 논다.', question_number: 21, reason: '장난감을 잡고 흔들며 놀 수 있다는 기록이 있습니다.', score: 3 },
          { question: '딸랑이나 숟가락과 같은 물건을 바닥에 두드리면서 논다.', question_number: 22, reason: '자료 부족', score: 0 },
          { question: '장난감이 떨어져 있는 곳을 쳐다본다.', question_number: 23, reason: '자료 부족', score: 0 },
          { question: '친숙한 어른이 안으려고 하면 팔을 벌린다.', question_number: 24, reason: '자료 부족', score: 0 }
        ]
      },
      {
        domain_id: 4,
        domain_name: '언어',
        questions: [
          { question: '아, 우, 이 등 의미 없는 발성을 한다.', question_number: 25, reason: '옹알이를 길게, 자주 한다는 기록이 여러 번 나타납니다.', score: 3 },
          { question: '아이를 어르거나 달래면 옹알이로 반응한다.', question_number: 26, reason: '어른과 대화하듯이 옹알이를 한다는 기록이 있습니다.', score: 3 },
          { question: '웃을 때 소리를 내며 웃는다.', question_number: 27, reason: '크게 웃거나 방긋방긋 웃는다는 표현으로 보아 소리 내어 웃는 것이 가능해 보입니다.', score: 3 },
          { question: '장난감이나 사람을 보고 소리를 내어 반응한다.', question_number: 28, reason: '장난감을 가지고 놀거나 사람을 보며 옹알이를 하거나 웃는다는 기록이 있습니다.', score: 3 },
          { question: '두 입술을 떨어서 내는 투레질 소리', question_number: 29, reason: '자료 부족', score: 0 },
          { question: '브, 쁘, 프, 므와 비슷한 소리를 낸다.', question_number: 30, reason: '자료 부족', score: 0 },
          { question: '엄마 또는 아빠와 비슷한 소리를 낸다', question_number: 31, reason: '자료 부족', score: 0 },
          { question: '아이에게 안돼요.라고 하면, 짧은 순간이라도 하던 행동을 멈추고 목소리에 반응한다.', question_number: 32, reason: '자료 부족', score: 0 }
        ]
      },
      {
        domain_id: 5,
        domain_name: '사회성',
        questions: [
          { question: '엄마(보호자)가 자리를 비웠다가 다시 나타나면 엄마(보호자)를 알아보고 울음을 그친다.', question_number: 33, reason: '자료 부족', score: 0 },
          { question: '아이가 엄마(보호자)와 이야기를 하거나 놀 때 엄마(보호자)의 얼굴을 바라본다.', question_number: 34, reason: '엄마 얼굴을 보고 크게 웃는다는 기록이 있습니다.', score: 3 },
          { question: '어른이 아이를 보며 말하거나 웃기 전에, 어른을 보고 먼저 웃는다.', question_number: 35, reason: '웃음이 많고, 엄마 얼굴을 보고 웃는 등 사회적 상호작용이 좋으나, 먼저 웃음을 시작하는지에 대한 명확한 기록은 부족합니다.', score: 2 },
          { question: '어른들의 얼굴(머리카락, 코, 안경 등)을 만져보거나 잡아당긴다.', question_number: 36, reason: '자료 부족', score: 0 },
          { question: '거울 속에 보이는 자신의 모습을 보고 웃거나 웅얼거린다.', question_number: 37, reason: '거울 보는 것을 좋아한다는 기록이 있습니다.', score: 3 },
          { question: '아이의 이름을 부르면 듣고 쳐다본다.', question_number: 38, reason: '자료 부족', score: 0 },
          { question: '가족 등 친숙한 사람을 보면 다가가려고 한다.', question_number: 39, reason: '자료 부족', score: 0 },
          { question: '낯가림을 한다', question_number: 40, reason: '자료 부족', score: 0 }
        ]
      },
      { domain_id: 6, domain_name: '자조', questions: [] },
      { domain_id: 7, domain_name: '추가 질문', questions: [] }
    ],
    final_opinion: {
      isWarning: true,
      opinion_text:
        '쭈니 부모님, 쭈니의 성장을 꼼꼼하게 기록하고 계신 모습이 정말 인상 깊습니다. 부모님의 사랑과 관심이 일기 곳곳에서 느껴집니다. 일기를 바탕으로 쭈니의 발달 상황을 살펴보니, 사회성, 언어, 소근육 발달은 아주 긍정적으로 잘 이루어지고 있습니다. 엄마와 눈을 맞추고 웃으며 상호작용하고, 옹알이로 대화하려는 모습, 장난감을 손으로 잘 잡고 노는 모습 모두 칭찬해 주고 싶은 부분입니다. 하지만 부모님께서 걱정하시는 것처럼, 대근육 발달 영역에서는 주의 깊게 살펴볼 필요가 있어 보입니다. 특히 개월 수에 비해 목 가누기가 여전히 불안정하고, 뒤집기를 전혀 시도하지 않으며, 엎드린 자세(터미타임)를 매우 힘들어하는 모습이 반복적으로 관찰됩니다. 이는 또래 발달 속도에 비해 다소 지연을 보이는 신호일 수 있습니다. 부모님의 걱정이 당연하며, 이는 결코 부모님의 잘못이 아닙니다. 아이들마다 발달 속도는 다르지만, 특정 영역에서 지속적인 지연이 관찰될 때는 전문가의 도움을 받아 원인을 파악하고 적절한 자극을 주는 것이 중요합니다. 가까운 시일 내에 소아청소년과 의사 또는 아동 발달 전문가와 상담하여 쭈니의 대근육 발달 상태를 정확하게 평가받아 보시기를 적극적으로 권장합니다. 조기에 전문가의 조언을 구하는 것이 쭈니의 건강한 성장에 큰 도움이 될 것입니다.',
      requirements: [
        '누워서 자기 발을 가지고 노는지 관찰해 주세요.',
        '손에 쥔 장난감이나 물건을 입으로 가져가는지 확인해 주세요.',
        '한 손에 장난감을 쥔 상태에서 다른 장난감을 주었을 때, 기존 장난감을 놓고 새것을 잡는지 관찰해 주세요.',
        '쭈니의 이름을 불렀을 때 소리 나는 쪽으로 고개를 돌려 쳐다보는지 확인해 주세요.',
        "옹알이를 할 때 '브', '므' 와 같은 입술 소리가 포함되는지 들어봐 주세요.",
        '낯선 사람을 만났을 때 어떤 반응을 보이는지(낯가림) 기록해 주세요.'
      ]
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '정상':
        return '#28a745';
      case '주의':
        return '#ffc107';
      case '위험':
        return '#dc3545';
      case '문제없음':
        return '#28a745';
      case '경고':
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
      case '문제없음':
        return <FiCheckCircle />;
      case '경고':
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

  // 점수 카드 표시 순서 및 타이틀을 하드코딩
  const fixedDomains = [
    { title: '대근육운동', key: 'grossMotor', type: 'score' },
    { title: '소근육운동', key: 'fineMotor', type: 'score' },
    { title: '인지', key: 'problemSolving', type: 'score' },
    { title: '언어', key: 'communication', type: 'score' },
    { title: '사회성', key: 'personalSocial', type: 'score' },
    { title: '자조', key: 'selfCare', type: 'score' },
  ];

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

  // 리포트 데이터가 없을 때 리포트 생성 화면 표시 (항상 먼저 노출)
  if (showGenerateScreen) {
    return (
      <PageLayout title="주간 리포트" titleStyle={titleStyle} showNavBar={true} backTo="/main">
        <div className="weekly-report-container">
          {/* 주간 리포트 생성하기 화면 */}
          <div className="weekly-report-header">
            <div className="period-navigation">
              <button className="period-nav-btn">
                <span>‹</span>
              </button>
              <span className="period-text">발달 리포트</span>
              <button className="period-nav-btn">
                <span>›</span>
              </button>
            </div>
          </div>

          <div className="empty-state">
            <div className="empty-message">
              아직 {childInfo?.name || '자녀'}의 발달 리포트를 찾을 수 없어요.
            </div>
            
            <button
              type="button"
              className="generate-report-btn"
              onClick={() => {
                try {
                  const uiData = transformAgentReportToUI(INSTANT_SAMPLE_AGENT_REPORT);
                  if (uiData) {
                    setReportData(uiData);
                    setHasReportData(true);
                    setShowGenerateScreen(false);
                  } else {
                    alert('샘플 데이터를 렌더링할 수 없습니다.');
                  }
                } catch (e) {
                  console.error('샘플 렌더링 오류:', e);
                  alert('샘플 렌더링 중 오류가 발생했습니다.');
                }
              }}
            >
              리포트 생성하기
            </button>
          </div>
        </div>

        <style jsx>{`
          .weekly-report-container {
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .weekly-report-header {
            margin-bottom: 40px;
          }

          .period-navigation {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .period-nav-btn {
            background: none;
            border: none;
            font-size: 24px;
            color: #666;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: background-color 0.2s;
          }

          .period-nav-btn:hover {
            background-color: rgba(0, 0, 0, 0.1);
          }

          .period-text {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            min-width: 150px;
            text-align: center;
          }

          .empty-state {
            text-align: center;
            max-width: 400px;
          }

          .empty-message {
            font-size: 18px;
            color: #666;
            margin-bottom: 40px;
            line-height: 1.5;
          }

          .generate-report-btn {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            min-width: 200px;
          }

          .generate-report-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
          }

          .generate-report-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
          }
        `}</style>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="리포트" titleStyle={titleStyle} showNavBar={true} backTo="/main">
      <div className="report-detail__content">
        {/* 아동 정보 헤더 */}
        <div className="report-detail__header">
          <div className="report-header-info">
            <div className="report-header-top">
              <h1 className="report-detail__title">
                발달 평가 리포트 <br></br> {reportData?.weekNumber && `(${reportData.weekNumber}주차)`}
              </h1>
              <button
                type="button"
                className="report-generate-button"
                onClick={() => setShowGenerateScreen(true)}
              >
                리포트      생성
              </button>
              <button
                type="button"
                className="report-generate-button"
                style={{ marginLeft: '10px', background: '#2196F3' }}
                onClick={async () => {
                  try {
                    if (!childId) return;
                    const qRes = await fetch(`${API_BASE}/questions/child/${childId}`);
                    const qData = await qRes.json();
                    const questions = Array.isArray(qData?.questions)
                      ? qData.questions.map((q) => q?.question_text).filter(Boolean)
                      : [];
                    if (questions.length === 0) {
                      alert('생성할 KDST 문항을 찾지 못했습니다.');
                      return;
                    }
                    const requestOnce = async () => {
                      const resp = await fetch(`${API_BASE}/report/kdst-generate-report`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ questions })
                      });
                      return resp.json();
                    };

                    const isValidContent = (content) => {
                      if (Array.isArray(content)) return content.length > 0; // [] 방지
                      if (content == null) return false;
                      const text = String(content).trim();
                      if (!text) return false;
                      if (text === '[]') return false;
                      return true;
                    };

                    let attempt = 0;
                    const maxRetries = 100; // 빈 응답 들어올 시 100회 재시도 (기본1회 요청 + 100회 재요청 = 101회 재요청)
                    let data = null;
                    let lastError = null;
                    while (attempt <= maxRetries) {
                      try {
                        attempt += 1;
                        console.log(`[Report] 생성 요청 시도 ${attempt}/${maxRetries + 1}`);
                        data = await requestOnce();
                        if (!data?.success) throw new Error(data?.message || '리포트 생성 실패');
                        const content = data?.report?.content;
                        if (isValidContent(content)) {
                          break; // 성공
                        } else {
                          console.warn('[Report] report.content가 비어있거나 [] 입니다. 재시도합니다.');
                          if (attempt <= maxRetries) {
                            await new Promise((r) => setTimeout(r, attempt * 600));
                            continue;
                          }
                        }
                      } catch (err) {
                        lastError = err;
                        console.warn(`[Report] 요청 실패 (시도 ${attempt})`, err?.message || err);
                        if (attempt <= maxRetries) {
                          await new Promise((r) => setTimeout(r, attempt * 600));
                          continue;
                        }
                      }
                      break;
                    }

                    if (!data?.success || !isValidContent(data?.report?.content)) {
                      throw new Error(lastError?.message || '리포트 생성에 여러 번 실패했습니다. 잠시 후 다시 시도해주세요.');
                    }

                    console.group('[Report] 생성 결과');
                    console.log('원본 응답 객체:', data);
                    console.log('LLM 응답 본문 (report.content):', data?.report?.content);
                    
                    let savedToDatabase = false;
                    try {
                      const parsed = data?.report?.content ? JSON.parse(data.report.content) : null;
                      if (parsed) {
                        console.log('LLM 응답 JSON 파싱 결과:', parsed);
                        const uiData = transformAgentReportToUI(parsed);
                        if (uiData) {
                          setReportData(uiData);
                          setHasReportData(true);
                          
                          // 데이터베이스에 저장
                          try {
                            await saveReportToDatabase(parsed, uiData);
                            savedToDatabase = true;
                            console.log('✅ 리포트가 데이터베이스에 저장되었습니다.');
                          } catch (saveError) {
                            console.error('❌ 리포트 DB 저장 실패:', saveError);
                            // 저장 실패해도 UI는 표시
                          }
                        }
                      }
                    } catch (e) {
                      console.log('LLM 응답은 JSON이 아니거나 파싱 불가:', e?.message);
                    }
                    console.groupEnd();
                    
                    // 사용자에게 결과 알림
                    if (savedToDatabase) {
                      alert('리포트 생성 및 저장이 완료되었습니다.');
                    } else {
                      alert('리포트 생성이 완료되었습니다.\n(저장 중 오류가 발생했을 수 있습니다.)');
                    }
                  } catch (e) {
                    console.error('리포트 생성 오류:', e);
                    alert(e?.message || '리포트 생성 중 오류가 발생했습니다.');
                  }
                }}
              >
                리포트      갱신
              </button>
            </div>
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

        {/* 주차별 평균 점수 그래프 */}
        <div className="report-summary-card report-weekly-trend" style={{ overflowX: 'auto' }}>
          <h2 className="weekly-trend-title">
            <FiTrendingUp className="section-icon" /> 주차별 평균 점수
          </h2>
          <WeeklyAverageChart data={weeklyAverages} />
        </div>

        {/* 전체 점수 카드 */}
        <div className="report-summary-card">
          <div className="summary-score-container">
            <div className="total-score">
              <span 
                className="score-number" 
                style={{ color: getStatusColor(reportData?.overallStatus) }}
              >
                {reportData?.totalScore}
              </span>
              <span 
                className="score-label" 
                style={{ color: getStatusColor(reportData?.overallStatus) }}
              >
                점
              </span>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="section-title">
              <FiTrendingUp className="section-icon" />
              영역별 발달 점수
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '42px', height: '6px', background: '#cbd5e1', borderRadius: '999px' }}></span>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>또래 평균: 15점</span>
            </div>
          </div>
          <div className="scores-grid">
            {fixedDomains.map(({ title, key, type }) => {
              // 현재 추가질문(flag)은 UI에서 분리됨 → type === 'flag' 케이스 제거

              const data = key ? reportData?.scores?.[key] : null;
              const score24 = typeof data?.score24 === 'number' ? data.score24 : null;
              const outOf = typeof data?.outOf === 'number' ? data.outOf : 24;
              const percent = typeof data?.percent === 'number' ? data.percent : (score24 != null && outOf > 0 ? Math.round((score24 / outOf) * 100) : null);
              const peerAvgPoints = 15;
              const peerAvgPercent = outOf > 0 ? Math.round((peerAvgPoints / outOf) * 100) : 0;
              const status = data?.status || '정보없음';
              return (
                <div key={title} className="score-card">
                  <div className="score-card-header">
                    <h3 className="score-domain">{title}</h3>
                    <div className="score-status" style={{ color: getStatusColor(status) }}>
                      {getStatusIcon(status)}
                      <span>{status}</span>
                    </div>
                  </div>
                  <div className="score-value">
                    <span 
                      className="score-number" 
                      style={{ color: getStatusColor(status) }}
                    >
                      {score24!= null ? score24 : '-'}
                    </span>
                    <span 
                      className="score-max" 
                      style={{ color: getStatusColor(status) }}
                    >
                      {score24 != null ? `/${outOf}` : outOf === 0 ? '/0' : ''}
                    </span>
                  </div>
                  <div className="score-progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${percent != null ? percent : 0}%`,
                        backgroundColor: getStatusColor(status),
                      }}
                    ></div>
                  </div>
                  {/* 또래 평균(15점) 회색 바 */}
                  <div style={{ marginTop: 6, width: '100%', height: 6, background: '#eef2f7', borderRadius: 999 }}>
                    <div style={{ width: `${peerAvgPercent}%`, height: '100%', background: '#cbd5e1', borderRadius: 999 }}></div>
                  </div>
                </div>
              );
            })}
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

          {(reportData?.finalOpinionText || buildAlertMessage(reportData?.scores)) && (
            <div className="checklist-alert">
              {reportData?.finalOpinionText || buildAlertMessage(reportData?.scores)}
            </div>
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

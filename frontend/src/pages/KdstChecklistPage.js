import React, { useMemo, useState, useEffect } from 'react';
import { FiUsers } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { questionsAPI } from '../utils/api';
import '../App.css';

function KdstChecklistPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const childId = location.state?.childId || localStorage.getItem('currentChildId');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

  // KDST 문항 가져오기
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!childId) {
        console.error('childId가 없습니다');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('KDST 문항 조회 시작, childId:', childId);
        
        const questionsData = await questionsAPI.getQuestionsForChild(childId);
        console.log('KDST 문항 조회 결과:', questionsData);
        
        if (questionsData && questionsData.questions && Array.isArray(questionsData.questions)) {
          // question_text만 추출하여 questions 배열에 저장
          const allQuestionTexts = questionsData.questions
            .map(q => q.question_text)
            .filter(text => text && text.trim());
          
          // 전체 문항에서 10개 랜덤 선택
          const shuffled = [...allQuestionTexts].sort(() => 0.5 - Math.random());
          const selectedQuestions = shuffled.slice(0, 10);
          
          setQuestions(selectedQuestions);
          console.log('전체 질문 수:', allQuestionTexts.length);
          console.log('랜덤 선택된 질문 수:', selectedQuestions.length);
        } else {
          console.warn('KDST 문항을 찾을 수 없습니다');
          setQuestions([]);
        }
      } catch (error) {
        console.error('KDST 문항 조회 실패:', error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [childId]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalCount = questions.length;
  const progressPercent = Math.round((answeredCount / totalCount) * 100);

  const handleToggle = (idx) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (next[idx]) delete next[idx];
      else next[idx] = true;
      return next;
    });
  };

  const handleSave = () => {
    alert('체크리스트가 저장되었습니다.');
    if (childId) navigate(`/report/${childId}`);
    else navigate('/main');
  };

  const titleStyle = { fontSize: '16px', color: '#000000', fontWeight: 'bold' };

  if (!childId) {
    return (
      <PageLayout title="K-DST 체크리스트" titleStyle={titleStyle} showNavBar={true} backTo="/main">
        <div className="kdst-page">
          <p style={{ textAlign: 'center', padding: '20px' }}>자녀 정보가 필요합니다.</p>
          <button onClick={() => navigate('/main')} style={{ margin: '0 auto', display: 'block' }}>
            메인으로 돌아가기
          </button>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout title="K-DST 체크리스트" titleStyle={titleStyle} showNavBar={true} backTo={childId ? `/report/${childId}` : '/main'}>
        <div className="kdst-page">
          <p style={{ textAlign: 'center', padding: '20px' }}>KDST 문항을 불러오는 중...</p>
        </div>
      </PageLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <PageLayout title="K-DST 체크리스트" titleStyle={titleStyle} showNavBar={true} backTo={childId ? `/report/${childId}` : '/main'}>
        <div className="kdst-page">
          <p style={{ textAlign: 'center', padding: '20px' }}>해당 자녀의 KDST 문항을 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/main')} style={{ margin: '0 auto', display: 'block' }}>
            메인으로 돌아가기
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="K-DST 체크리스트" titleStyle={titleStyle} showNavBar={true} backTo={childId ? `/report/${childId}` : '/main'}>
      <div className="kdst-page">
        <p className="kdst-subtitle">이번 주, 아이의 발달 상황을 간단히 확인해보세요.</p>
        <p className="kdst-info" style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '15px' }}>
          전체 KDST 문항 중 10개를 랜덤으로 선택하여 보여드립니다.
        </p>

        <div className="kdst-progress">
          <span className="kdst-progress__label">{`${answeredCount} / ${totalCount} 문항`}</span>
          <div className="kdst-progress__track">
            <div className="kdst-progress__bar" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="kdst-list">
          {questions.map((q, idx) => {
            const selected = Boolean(answers[idx]);
            return (
              <button
                type="button"
                key={idx}
                className={`kdst-item${selected ? ' kdst-item--selected' : ''}`}
                onClick={() => handleToggle(idx)}
              >
                <span className="kdst-item__icon">
                  <FiUsers />
                </span>
                <span className="kdst-item__text">{q}</span>
              </button>
            );
          })}
        </div>

        <button className="kdst-save-button" onClick={handleSave}>저장</button>
      </div>
    </PageLayout>
  );
}

export default KdstChecklistPage;



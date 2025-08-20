import React, { useMemo, useState } from 'react';
import { FiUsers } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import '../App.css';

function KdstChecklistPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const childId = location.state?.childId || localStorage.getItem('currentChildId');

  const questions = useMemo(
    () => Array(10).fill(''),
    []
  );

  const [answers, setAnswers] = useState({});

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

  return (
    <PageLayout title="K-DST 체크리스트" titleStyle={titleStyle} showNavBar={true} backTo={childId ? `/report/${childId}` : '/main'}>
      <div className="kdst-page">
        <p className="kdst-subtitle">이번 주, 아이의 발달 상황을 간단히 확인해보세요.</p>

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



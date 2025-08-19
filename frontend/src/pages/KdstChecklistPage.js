import React, { useMemo, useState } from 'react';
import { FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import '../App.css';

function KdstChecklistPage() {
  const navigate = useNavigate();

  const questions = useMemo(
    () => [
      '다른 아이들과 어울려 노는 것을 즐기나요?',
      '다른 아이의 행동에 대해 이야기를 하나요?',
      '자신의 기분을 좋거나 나쁘다고 말하나요?',
      '친숙한 사람과 눈을 맞추고 미소를 짓나요?',
      '부모의 지시에 간단히 따르나요?',
      '놀이에서 차례를 기다릴 수 있나요?',
      '원하는 것을 말이나 몸짓으로 표현하나요?',
      '간단한 규칙을 이해하고 지키나요?',
      '친구의 감정을 인식하고 반응하나요?',
      '도움을 요청할 수 있나요?',
    ],
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
    navigate(-1);
  };

  const titleStyle = { fontSize: '16px', color: '#000000', fontWeight: 'bold' };

  return (
    <PageLayout title="K-DST 체크리스트" titleStyle={titleStyle} showNavBar={true} backTo="/ai-analysis">
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



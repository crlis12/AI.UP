import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import '../App.css';

function AIAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { childId, childName } = location.state || {};
  const [input1, setInput1] = useState('주간 리포트');

  // 상담사 매칭 페이지로 이동
  const handleCounselorMatching = () => {
    if (!childId) {
      alert('자녀 정보가 필요합니다.');
      return;
    }
    navigate('/counselor-matching', {
      state: {
        childId: childId,
        childName: childName
      }
    });
  };

  const titleStyle = { fontSize: '16px', color: '#000000', fontWeight: 'bold' };

  return (
    <PageLayout title="리포트" titleStyle={titleStyle} showNavBar={true} backTo="/main">
      <div className="child-info-page contain">
        <div className="scroll-view">
          <div className="column">
            {/* 상단 헤더 */}
            <div className="view">
              <div className="column2">
                <span className="text">{childName || '자녀'}의 발달 분석</span>
              </div>
            </div>

            {/* 발달 점수 섹션 */}
            <div className="view2">
              <span className="text2">종합 발달 점수</span>
              <div className="circular-score">
                <div className="score-circle">
                  <span className="score-number">90</span>
                  <span className="score-label">점</span>
                </div>
                <span className="score-description">상위 10%</span>
              </div>
            </div>

            {/* 영역별 발달 현황 */}
            <div className="column3">
              <span className="text3">영역별 발달 현황</span>
              
              {/* 언어발달 */}
              <div className="development-item">
                <div className="development-header">
                  <span className="development-title">언어발달</span>
                  <span className="development-score">85점</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '85%' }}></div>
                </div>
                <span className="development-status">양호</span>
              </div>

              {/* 사회성발달 */}
              <div className="development-item">
                <div className="development-header">
                  <span className="development-title">사회성발달</span>
                  <span className="development-score">70점</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '70%' }}></div>
                </div>
                <span className="development-status attention">주의 필요</span>
              </div>

              {/* 인지발달 */}
              <div className="development-item">
                <div className="development-header">
                  <span className="development-title">인지발달</span>
                  <span className="development-score">92점</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '92%' }}></div>
                </div>
                <span className="development-status">우수</span>
              </div>

              {/* 운동발달 */}
              <div className="development-item">
                <div className="development-header">
                  <span className="development-title">운동발달</span>
                  <span className="development-score">88점</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '88%' }}></div>
                </div>
                <span className="development-status">양호</span>
              </div>

              {/* 정서발달 */}
              <div className="development-item">
                <div className="development-header">
                  <span className="development-title">정서발달</span>
                  <span className="development-score">78점</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '78%' }}></div>
                </div>
                <span className="development-status">보통</span>
              </div>
            </div>

            {/* 또래 평균 비교 */}
            <div className="comparison-section">
              <span className="text18">또래 평균 비교</span>
              <div className="comparison-chart">
                <div className="comparison-item">
                  <span className="comparison-label">우리 아이</span>
                  <div className="comparison-bar my-child">
                    <div className="bar-fill" style={{ width: '90%' }}></div>
                  </div>
                  <span className="comparison-score">90</span>
                </div>
                <div className="comparison-item">
                  <span className="comparison-label">또래 평균</span>
                  <div className="comparison-bar average">
                    <div className="bar-fill" style={{ width: '70%' }}></div>
                  </div>
                  <span className="comparison-score">70</span>
                </div>
              </div>
            </div>

            {/* 특별 주의사항 */}
            <div className="attention-section">
              <span className="text19">이 부분은 특별히 봐주세요!</span>
              <div className="attention-box">
                <span className="attention-text">
                  사회성 영역에서 또래보다 발달이 느려요. 
                  {'\n'}전문가와 상담을 받아보는 건 어떨까요?
                </span>
              </div>
              
              {/* 상담사 연결하기 버튼 */}
              <div className="counselor-button" onClick={handleCounselorMatching} style={{ cursor: 'pointer' }}>
                <span className="counselor-button-text">상담사 연결하기</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .circular-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 20px 0;
        }

        .score-circle {
          width: 120px;
          height: 120px;
          border: 8px solid #4CAF50;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .score-number {
          font-size: 36px;
          font-weight: bold;
          color: #4CAF50;
        }

        .score-label {
          font-size: 14px;
          color: #666;
        }

        .score-description {
          font-size: 16px;
          color: #4CAF50;
          font-weight: bold;
        }

        .development-item {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 10px;
        }

        .development-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .development-title {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }

        .development-score {
          font-size: 16px;
          font-weight: bold;
          color: #4CAF50;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .development-status {
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 12px;
          background: #4CAF50;
          color: white;
          display: inline-block;
        }

        .development-status.attention {
          background: #FF9800;
        }

        .comparison-section {
          margin: 30px 0;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 10px;
        }

        .comparison-chart {
          margin-top: 15px;
        }

        .comparison-item {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .comparison-label {
          width: 80px;
          font-size: 14px;
          color: #666;
        }

        .comparison-bar {
          flex: 1;
          height: 20px;
          background: #e0e0e0;
          border-radius: 10px;
          margin: 0 10px;
          overflow: hidden;
        }

        .comparison-bar.my-child .bar-fill {
          background: #4CAF50;
        }

        .comparison-bar.average .bar-fill {
          background: #9E9E9E;
        }

        .bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .comparison-score {
          width: 30px;
          text-align: right;
          font-weight: bold;
          color: #333;
        }

        .attention-section {
          margin: 30px 0;
        }

        .text19 {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          display: block;
        }

        .attention-box {
          background: #FFF3E0;
          border: 1px solid #FFB74D;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .attention-text {
          font-size: 16px;
          color: #E65100;
          line-height: 1.5;
          white-space: pre-line;
        }

        .counselor-button {
          background: #2196F3;
          color: white;
          padding: 15px 30px;
          border-radius: 25px;
          text-align: center;
          transition: background 0.3s ease;
        }

        .counselor-button:hover {
          background: #1976D2;
        }

        .counselor-button-text {
          font-size: 16px;
          font-weight: bold;
        }

        .text, .text2, .text3 {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
          display: block;
        }
      `}</style>
    </PageLayout>
  );
}

export default AIAnalysisPage;

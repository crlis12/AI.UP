import React from 'react';
import { Link } from 'react-router-dom'; // Link 컴포넌트 불러오기

function AIAnalysisPage() {
  return (
    <div>
      <h1>AI 분석 페이지</h1>
      <p>이곳에 AI 분석 기능이 들어갑니다.</p>
      <Link to="/">메인으로 돌아가기</Link>
    </div>
  );
}

export default AIAnalysisPage;
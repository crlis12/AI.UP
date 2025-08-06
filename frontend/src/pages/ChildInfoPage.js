import React from 'react';
import { Link } from 'react-router-dom'; // Link 컴포넌트 불러오기

function ChildInfoPage() {
  return (
    <div>
      <h1>내 아이 정보 페이지</h1>
      <p>이곳에 아이 정보를 보여주는 내용이 들어갑니다.</p>
      <Link to="/">메인으로 돌아가기</Link>
    </div>
  );
}

export default ChildInfoPage;
import React from 'react';
import BackButton from './BackButton';

function PageLayout({ children, title }) {
  return (
    <div className="page-layout-container">
      <header className="page-header">
        <BackButton />
        {title && <h1 className="page-title">{title}</h1>}
      </header>
      {/* 이 부분에 각 페이지의 실제 내용이 들어옵니다. */}
      <main className="page-content-centered">
        {children} 
      </main>
    </div>
  );
}

export default PageLayout;

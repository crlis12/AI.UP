import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function SideMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <button className="hamburger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        ☰
      </button>

      {isMenuOpen && (
        <nav className="menu-panel">
          <Link to="/child-info" className="menu-button">내 아이 정보</Link>
          <Link to="/ai-analysis" className="menu-button">내 아이의 이야기</Link>
        </nav>
      )}
    </>
  );
}

export default SideMenu;
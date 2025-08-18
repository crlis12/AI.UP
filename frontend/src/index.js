// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // 이 부분이 있는지 확인

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {' '}
      {/* <App />을 감싸고 있는지 확인 */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

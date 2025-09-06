import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { counselorsAPI } from '../utils/api';
import '../App.css';

function CounselorMatchingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { childId, childName } = location.state || {};

  const [counselors, setCounselors] = useState([]);
  const [filteredCounselors, setFilteredCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [message, setMessage] = useState('');
  const [showMatchingModal, setShowMatchingModal] = useState(false);

  // 지역 목록 (region_id 1~10)
  const regions = [
    { id: '', name: '전체 지역' },
    { id: 1, name: '서울' },
    { id: 2, name: '경기' },
    { id: 3, name: '인천' },
    { id: 4, name: '부산' },
    { id: 5, name: '대구' },
    { id: 6, name: '광주' },
    { id: 7, name: '대전' },
    { id: 8, name: '울산' },
    { id: 9, name: '세종' },
    { id: 10, name: '강원' },
  ];

  // 도메인 목록
  const domains = [
    '전체 분야',
    '언어발달',
    '사회성발달',
    '인지발달',
    '운동발달',
    '정서발달',
    '행동발달',
    '학습발달',
    '특수교육',
  ];

  // 상담사 목록 조회
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        setLoading(true);
        const data = await counselorsAPI.getCounselors();
        setCounselors(data.counselors || []);
        setFilteredCounselors(data.counselors || []);
      } catch (error) {
        console.error('상담사 목록 조회 실패:', error);
        alert('상담사 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCounselors();
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = counselors;

    if (selectedRegion) {
      filtered = filtered.filter(c => c.region_id === parseInt(selectedRegion));
    }

    if (selectedDomain && selectedDomain !== '전체 분야') {
      filtered = filtered.filter(c => c.domain === selectedDomain);
    }

    setFilteredCounselors(filtered);
  }, [counselors, selectedRegion, selectedDomain]);

  // 상담사 선택
  const handleSelectCounselor = (counselor) => {
    setSelectedCounselor(counselor);
    setShowMatchingModal(true);
  };

  // 매칭 요청
  const handleMatchingRequest = async () => {
    if (!selectedCounselor || !childId) {
      alert('필요한 정보가 부족합니다.');
      return;
    }

    try {
      await counselorsAPI.requestCounselorMatching(
        childId,
        selectedCounselor.counselor_id,
        message
      );
      
      alert('상담사 매칭 요청이 완료되었습니다!\n곧 연락드릴 예정입니다.');
      setShowMatchingModal(false);
      navigate(-1); // 이전 페이지로 돌아가기
    } catch (error) {
      console.error('매칭 요청 실패:', error);
      alert('매칭 요청에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!childId) {
    return (
      <PageLayout title="상담사 매칭" showNavBar={true}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>자녀 정보가 필요합니다.</p>
          <button onClick={() => navigate(-1)}>돌아가기</button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`${childName || '자녀'}의 상담사 찾기`} showNavBar={true} backTo="/main">
      <div className="counselor-matching-container">
        {/* 필터 섹션 */}
        <div className="filter-section">
          <h3 className="section-title">상담사 검색 필터</h3>
          
          <div className="filter-row">
            <div className="filter-item">
              <label className="filter-label">지역</label>
              <select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="filter-select"
              >
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">전문 분야</label>
              <select 
                value={selectedDomain} 
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="filter-select"
              >
                {domains.map(domain => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 상담사 목록 */}
        <div className="counselor-list-section">
          <h3 className="section-title">상담사 목록 ({filteredCounselors.length}명)</h3>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-text">로딩 중...</div>
            </div>
          ) : filteredCounselors.length === 0 ? (
            <div className="empty-container">
              <div className="empty-text">조건에 맞는 상담사가 없습니다.</div>
            </div>
          ) : (
            <div className="counselor-grid">
              {filteredCounselors.map(counselor => (
                <div key={counselor.idx} className="counselor-card">
                  <div className="counselor-info">
                    <h4 className="counselor-name">{counselor.name}</h4>
                    <div className="counselor-details">
                      <span className="counselor-domain">{counselor.domain}</span>
                      <span className="counselor-region">{counselor.region}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectCounselor(counselor)}
                    className="counseling-request-btn"
                  >
                    상담신청
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 매칭 요청 모달 */}
        {showMatchingModal && selectedCounselor && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">{selectedCounselor.name} 상담사에게 상담 신청</h3>
              
              <div className="counselor-info-modal">
                <div className="info-item">
                  <strong>전문분야:</strong> {selectedCounselor.domain}
                </div>
                <div className="info-item">
                  <strong>지역:</strong> {selectedCounselor.region}
                </div>
              </div>

              <div className="message-section">
                <label className="message-label">상담 요청 메시지</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="상담받고 싶은 내용이나 자녀의 상황을 간단히 적어주세요..."
                  className="message-textarea"
                />
              </div>

              <div className="modal-buttons">
                <button
                  onClick={() => setShowMatchingModal(false)}
                  className="cancel-btn"
                >
                  취소
                </button>
                <button
                  onClick={handleMatchingRequest}
                  className="submit-btn"
                >
                  상담신청
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .counselor-matching-container {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .filter-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          margin-top: 0;
        }

        .filter-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .filter-select {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          color: #333;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .counselor-list-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .loading-container,
        .empty-container {
          text-align: center;
          padding: 40px 20px;
        }

        .loading-text,
        .empty-text {
          font-size: 16px;
          color: #666;
        }

        .counselor-grid {
          display: grid;
          gap: 15px;
        }

        .counselor-card {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          // display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transition: box-shadow 0.2s ease;
          min-height: 80px;
        }

        .counselor-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .counselor-info {
          flex: 1;
          margin-right: 20px;
        }

        .counselor-name {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin: 0 0 8px 0;
        }

        .counselor-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin-top: 8px;
        }

        .counselor-domain,
        .counselor-region {
          font-size: 12px;
          color: #666;
          background: #e9ecef;
          padding: 6px 10px;
          border-radius: 12px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .counseling-request-btn {
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          align-self: flex-start;
          margin-top: 21px;
          margin-left: 118px;
        }

        .counseling-request-btn:hover {
          background: #45a049;
          transform: translateY(-1px);
        }

        .counseling-request-btn:active {
          transform: translateY(0);
        }

        /* 모달 스타일 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 30px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin: 0 0 20px 0;
          text-align: center;
        }

        .counselor-info-modal {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .info-item {
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .message-section {
          margin-bottom: 25px;
        }

        .message-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .message-textarea {
          width: 100%;
          height: 100px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }

        .message-textarea:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-btn,
        .submit-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        .submit-btn {
          background: #4CAF50;
          color: white;
        }

        .submit-btn:hover {
          background: #45a049;
          transform: translateY(-1px);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .filter-row {
            flex-direction: column;
          }

          .filter-item {
            min-width: auto;
          }

          .counselor-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
            min-height: auto;
          }

          .counselor-info {
            margin-right: 0;
            width: 100%;
          }

          .counselor-details {
            flex-wrap: wrap;
            gap: 6px;
          }

          .counseling-request-btn {
            
            text-align: center;
            margin-top: 0;
          }

          .modal-buttons {
            flex-direction: column;
          }

          .cancel-btn,
          .submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </PageLayout>
  );
}

export default CounselorMatchingPage;

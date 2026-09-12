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
    <PageLayout title={`${childName || '자녀'}의 상담사 찾기`} showNavBar={true}>
      <div style={{ padding: '20px' }}>
        {/* 필터 섹션 */}
        <div style={{ marginBottom: '20px' }}>
          <h3>상담사 검색 필터</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label>지역:</label>
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>전문 분야:</label>
            <select 
              value={selectedDomain} 
              onChange={(e) => setSelectedDomain(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              {domains.map(domain => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 상담사 목록 */}
        <div>
          <h3>상담사 목록 ({filteredCounselors.length}명)</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              로딩 중...
            </div>
          ) : filteredCounselors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              조건에 맞는 상담사가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredCounselors.map(counselor => (
                <div 
                  key={counselor.idx} 
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{counselor.name}</h4>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        전문분야: {counselor.domain}
                      </p>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        지역: {counselor.region}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectCounselor(counselor)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      상담 신청
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 매칭 요청 모달 */}
        {showMatchingModal && selectedCounselor && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3>{selectedCounselor.name} 상담사에게 상담 신청</h3>
              
              <div style={{ margin: '15px 0' }}>
                <p><strong>전문분야:</strong> {selectedCounselor.domain}</p>
                <p><strong>지역:</strong> {selectedCounselor.region}</p>
              </div>

              <div style={{ margin: '15px 0' }}>
                <label>상담 요청 메시지:</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="상담받고 싶은 내용이나 자녀의 상황을 간단히 적어주세요..."
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    marginTop: '5px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowMatchingModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleMatchingRequest}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  상담 신청
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default CounselorMatchingPage;

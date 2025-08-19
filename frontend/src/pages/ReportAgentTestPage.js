import React, { useState } from 'react';
import { reportAPI } from '../utils/api';

function ReportAgentTestPage() {
  const [query, setQuery] = useState('최근 한달 아기 발달 요약');
  const [userInput, setUserInput] = useState('다음 일기들을 바탕으로 발달 보고서를 작성해줘.');
  const [diaryString, setDiaryString] = useState('');
  const [useRagAsInput, setUseRagAsInput] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await reportAPI.ragReport({
        query,
        input: userInput,
        diaryString: diaryString || undefined,
        useRagAsInput,
        config: { vendor: 'gemini', model: 'gemini-2.5-flash' },
        spec: { language: 'Korean', reportType: '테스트 보고서' }
      });
      setResult(data);
    } catch (err) {
      setError(err.message || '요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
      <h2>Report Agent 테스트</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Query (RAG 검색용)
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 6개월 아기 대근육 발달"
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <label>
          사용자 입력 (보고서 요청문)
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={3}
            placeholder="예: 다음 일기들을 바탕으로 발달 보고서를 작성해줘."
            style={{ width: '100%', padding: 8 }}
          />
        </label>
        <label>
          일기 문자열 (선택)
          <textarea
            value={diaryString}
            onChange={(e) => setDiaryString(e.target.value)}
            rows={8}
            placeholder="RAG로 변환된 육아일기 문자열을 붙여넣으세요."
            style={{ width: '100%', padding: 8, fontFamily: 'monospace' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={useRagAsInput}
            onChange={(e) => setUseRagAsInput(e.target.checked)}
          />
          RAG 결과를 입력으로 사용(또는 사용자 입력과 결합)
        </label>
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? '요청 중...' : '보고서 생성 요청'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 16, color: 'red' }}>{error}</div>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>응답</h3>
          <div style={{ marginBottom: 12 }}>
            <strong>사용된 입력 출처:</strong> {result.input_source || 'N/A'}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', border: '1px solid #ddd', padding: 12, borderRadius: 4 }}>
            {result.report?.content || '보고서 본문 없음'}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportAgentTestPage;




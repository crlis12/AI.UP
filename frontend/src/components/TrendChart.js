import React from 'react';

function generateSplinePath(points, tension = 0.4) {
  if (!points || points.length < 2) {
    return '';
  }

  const cps = (p0, p1, p2, t) => {
    const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const fa = (t * d01) / (d01 + d12 || 1);
    const fb = (t * d12) / (d01 + d12 || 1);
    const p1x = p1.x - fa * (p2.x - p0.x);
    const p1y = p1.y - fa * (p2.y - p0.y);
    const p2x = p1.x + fb * (p2.x - p0.x);
    const p2y = p1.y + fb * (p2.y - p0.y);
    return [{ x: p1x, y: p1y }, { x: p2x, y: p2y }];
  };

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const [cp1] = cps(p0, p1, p2, tension);
    const [, cp2] = cps(p1, p2, p3, tension);
    d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function TrendChart({ labels = [], values = [], height = 160 }) {
  const width = 320;
  const padding = { top: 12, right: 12, bottom: 22, left: 12 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const safeValues = Array.isArray(values) && values.length > 0 ? values : [0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const span = Math.max(1, max - min);
  const yMin = min - span * 0.15;
  const yMax = max + span * 0.15;
  const n = safeValues.length;
  const step = n > 1 ? chartWidth / (n - 1) : chartWidth;

  const points = safeValues.map((v, i) => {
    const x = padding.left + i * step;
    const ratio = (v - yMin) / (yMax - yMin);
    const y = padding.top + (1 - ratio) * chartHeight;
    return { x, y };
  });

  const pathD = generateSplinePath(points);
  const areaD = `${pathD} L ${padding.left + (n - 1) * step} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const gridCount = 3;
  const gridYs = Array.from({ length: gridCount }, (_, i) => padding.top + (i + 1) * (chartHeight / (gridCount + 1)));

  const gradientId = 'trendGradient';

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="발달 점수 추이">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2f6b19" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2f6b19" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridYs.map((y, idx) => (
          <line key={idx} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e6e9ed" strokeDasharray="4 4" />
        ))}

        <path d={areaD} fill={`url(#${gradientId})`} />
        <path d={pathD} fill="none" stroke="#2f6b19" strokeWidth="2.5" />

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="#2f6b19" />
        ))}
      </svg>

      {labels && labels.length > 0 && (
        <div className="trend-chart__labels">
          {labels.map((l, i) => (
            <span key={i} className="trend-chart__label">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}



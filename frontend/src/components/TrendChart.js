import React, { useMemo, useState, useCallback } from 'react';

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

export default function TrendChart({
  labels = [],
  values = [],
  height = 160,
  yGridCount = 3,
  showArea = true,
  showYAxisLabels = true,
  lineColor = '#2f6b19',
  areaColor = '#2f6b19',
  curve = 'monotone' // 'monotone' | 'linear' | 'spline'
}) {
  const width = 320;
  const padding = { top: 12, right: 12, bottom: 22, left: 28 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const safeValues = useMemo(() => (Array.isArray(values) && values.length > 0 ? values : [0]), [values]);
  const min = useMemo(() => Math.min(...safeValues), [safeValues]);
  const max = useMemo(() => Math.max(...safeValues), [safeValues]);
  const span = useMemo(() => Math.max(1, max - min), [max, min]);
  const yMin = useMemo(() => min - span * 0.15, [min, span]);
  const yMax = useMemo(() => max + span * 0.15, [max, span]);
  const n = safeValues.length;
  const step = n > 1 ? chartWidth / (n - 1) : chartWidth;

  const points = safeValues.map((v, i) => {
    const x = padding.left + i * step;
    const ratio = (v - yMin) / (yMax - yMin);
    const y = padding.top + (1 - ratio) * chartHeight;
    return { x, y };
  });

  // --- Path generation helpers ---
  const generateLinearPath = (pts) => {
    if (!pts || pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
    return d;
  };

  // Fritsch–Carlson monotone cubic interpolation (d3-shape curveMonotoneX 기반)
  const generateMonotonePath = (pts) => {
    const n = pts.length;
    if (n < 2) return '';
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const dx = new Array(n - 1);
    const dy = new Array(n - 1);
    const slopes = new Array(n - 1);
    for (let i = 0; i < n - 1; i++) {
      dx[i] = xs[i + 1] - xs[i];
      dy[i] = ys[i + 1] - ys[i];
      slopes[i] = dy[i] / (dx[i] || 1);
    }
    const m = new Array(n);
    m[0] = slopes[0];
    m[n - 1] = slopes[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = (slopes[i - 1] + slopes[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (slopes[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const a = m[i] / slopes[i];
        const b = m[i + 1] / slopes[i];
        const h = Math.hypot(a, b);
        if (h > 3) {
          const t = 3 / h;
          m[i] = t * a * slopes[i];
          m[i + 1] = t * b * slopes[i];
        }
      }
    }
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i];
      const x1 = xs[i] + h / 3;
      const y1 = ys[i] + (m[i] * h) / 3;
      const x2 = xs[i + 1] - h / 3;
      const y2 = ys[i + 1] - (m[i + 1] * h) / 3;
      d += ` C ${x1} ${y1}, ${x2} ${y2}, ${xs[i + 1]} ${ys[i + 1]}`;
    }
    return d;
  };

  const pathD = useMemo(() => {
    if (curve === 'linear') return generateLinearPath(points);
    if (curve === 'spline') return generateSplinePath(points);
    return generateMonotonePath(points);
  }, [curve, points]);
  const areaD = `${pathD} L ${padding.left + (n - 1) * step} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const gridYs = useMemo(
    () => Array.from({ length: yGridCount }, (_, i) => padding.top + (i + 1) * (chartHeight / (yGridCount + 1))),
    [chartHeight, yGridCount]
  );

  const gridLabelValues = useMemo(
    () => {
      const ticks = yGridCount + 2; // include top/bottom
      return Array.from({ length: ticks }, (_, i) => yMin + (i * (yMax - yMin)) / (ticks - 1));
    },
    [yGridCount, yMin, yMax]
  );

  const gridLabelYs = useMemo(
    () => gridLabelValues.map(v => padding.top + (1 - (v - yMin) / (yMax - yMin)) * chartHeight),
    [gridLabelValues, chartHeight, yMin, yMax]
  );

  const [activeIndex, setActiveIndex] = useState(null);

  const handlePointer = useCallback((clientX, rect) => {
    if (!rect) return;
    const xInSvg = ((clientX - rect.left) * width) / rect.width; // map to viewBox
    let nearest = 0;
    let nearestDx = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dx = Math.abs(points[i].x - xInSvg);
      if (dx < nearestDx) {
        nearest = i;
        nearestDx = dx;
      }
    }
    setActiveIndex(nearest);
  }, [points]);

  const onMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handlePointer(e.clientX, rect);
  }, [handlePointer]);

  const onTouchMove = useCallback((e) => {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handlePointer(touch.clientX, rect);
  }, [handlePointer]);

  const onLeave = useCallback(() => setActiveIndex(null), []);

  const gradientId = 'trendGradient';

  return (
    <div className="trend-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="발달 점수 추이"
        onMouseMove={onMouseMove}
        onMouseLeave={onLeave}
        onTouchStart={onTouchMove}
        onTouchMove={onTouchMove}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={areaColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={areaColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridYs.map((y, idx) => (
          <line key={idx} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e6e9ed" strokeDasharray="4 4" />
        ))}

        {showYAxisLabels && gridLabelYs.map((y, i) => (
          <text key={`ylab-${i}`} x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#9CA3AF">
            {Math.round(gridLabelValues[i])}
          </text>
        ))}

        {showArea && <path d={areaD} fill={`url(#${gradientId})`} />}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" />

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={activeIndex === i ? 4.4 : 3.2} fill={lineColor} />
        ))}

        {activeIndex !== null && (
          <g>
            <line
              x1={points[activeIndex].x}
              x2={points[activeIndex].x}
              y1={padding.top}
              y2={padding.top + chartHeight}
              stroke="#d1d5db"
              strokeDasharray="3 3"
            />
            {(() => {
              const px = points[activeIndex].x;
              const py = points[activeIndex].y;
              const boxWidth = 74;
              const boxHeight = 28;
              const boxX = Math.min(Math.max(px - boxWidth / 2, padding.left), width - padding.right - boxWidth);
              const boxY = Math.max(py - boxHeight - 10, padding.top + 2);
              const valueText = `${safeValues[activeIndex]}`;
              const labelText = labels && labels[activeIndex] ? labels[activeIndex] : '';
              return (
                <g>
                  <rect x={boxX} y={boxY} rx={6} ry={6} width={boxWidth} height={boxHeight} fill="#111827" opacity="0.9" />
                  <text x={boxX + 8} y={boxY + 13} fontSize="10" fill="#D1FAE5">{labelText}</text>
                  <text x={boxX + 8} y={boxY + 23} fontSize="12" fill="#FFFFFF" fontWeight="700">{valueText}</text>
                </g>
              );
            })()}
          </g>
        )}
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



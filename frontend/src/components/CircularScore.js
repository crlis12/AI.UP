// src/components/CircularScore.js

import React from 'react';

function CircularScore({
  score = 0,
  size = 180,
  strokeWidth = 12,
  label = '종합발달점수',
  subLabel = '상위 10%',
  showRing = true,
  contentOffsetY = 0,
  labelPosition = 'top',
}) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - normalizedScore / 100);

  return (
    <div className="circular-score" style={{ width: size, height: size }}>
      {showRing && (
        <svg className="circular-score__svg" width={size} height={size}>
          <circle
            className="circular-score__bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            className="circular-score__fg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
      )}
      <div
        className="circular-score__content"
        style={contentOffsetY ? { transform: `translateY(${contentOffsetY}px)` } : undefined}
      >
        {label && labelPosition === 'top' && (
          <div className="circular-score__label" style={{ marginTop: 0, marginBottom: 6 }}>
            {label}
          </div>
        )}
        <div className="circular-score__value">{normalizedScore}점</div>
        {subLabel && <div className="circular-score__sublabel">{subLabel}</div>}
      </div>
      {label && labelPosition === 'bottom' && <div className="circular-score__label">{label}</div>}
    </div>
  );
}

export default CircularScore;

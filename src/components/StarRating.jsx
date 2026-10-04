import React, { useState } from 'react';

export function StarRating({ rating = 0, onRate, readonly = false, size = 20 }) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (val) => {
    if (!readonly && onRate) {
      onRate(val);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 select-none" style={{ cursor: readonly ? 'default' : 'pointer' }}>
      {stars.map((starIndex) => {
        const fillAmount = Math.max(0, Math.min(1, displayRating - (starIndex - 1)));
        const isHalf = fillAmount >= 0.25 && fillAmount < 0.75;
        const isFull = fillAmount >= 0.75;

        return (
          <div
            key={starIndex}
            className="relative flex items-center justify-center"
            style={{ width: `${size}px`, height: `${size}px` }}
            onClick={(e) => {
              if (readonly) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              const val = clickPos <= 0.5 ? starIndex - 0.5 : starIndex;
              handleClick(val);
            }}
            onMouseMove={(e) => {
              if (readonly) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const hoverPos = (e.clientX - rect.left) / rect.width;
              const val = hoverPos <= 0.5 ? starIndex - 0.5 : starIndex;
              setHoverRating(val);
            }}
            onMouseLeave={() => !readonly && setHoverRating(0)}
          >
            {/* Base Outline Star */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D3CDC0"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>

            {/* Filled Overlay */}
            {(isFull || isHalf) && (
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: isHalf ? '50%' : '100%' }}
              >
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 24 24"
                  fill="#BA3822"
                  stroke="#BA3822"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="flex-between mb-12">
        <div>
          <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 100, height: 11, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 6 }} />
      </div>
      <div className="flex-center gap-6 mb-12">
        <div className="skeleton" style={{ width: 48, height: 20, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--radius-btn)' }} />
    </div>
  );
}

export default SkeletonCard;

import React from 'react';
import ChallengeCard from './ChallengeCard';
import SkeletonCard from './SkeletonCard';

function ChallengeList({
  challenges,
  loading,
  onJoin,
  onSubmitProof,
  onVote,
  onDistribute,
  onViewDetail,
  onRequestToJoin,
  emptyTitle,
  emptyBody,
  emptyCta,
  onEmptyCta,
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="14" stroke="#a8d8d0" strokeWidth="2"/>
            <path d="M20 13v7l4 4" stroke="#a8d8d0" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 34c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#e88fa0" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="empty-title">{emptyTitle || 'No challenges yet'}</p>
        <p className="empty-body">{emptyBody || 'Create a challenge to get started, or check back soon.'}</p>
        {emptyCta && onEmptyCta && (
          <button className="btn btn-teal" style={{ maxWidth: 220 }} onClick={onEmptyCta}>
            {emptyCta}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
      {challenges.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          onJoin={onJoin}
          onSubmitProof={onSubmitProof}
          onVote={onVote}
          onDistribute={onDistribute}
          onViewDetail={onViewDetail}
          onRequestToJoin={onRequestToJoin}
          loading={loading}
        />
      ))}
    </div>
  );
}

export default ChallengeList;

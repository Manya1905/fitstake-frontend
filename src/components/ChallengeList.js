import React from 'react';
import ChallengeCard from './ChallengeCard';

function ChallengeList({ challenges, loading, onJoin, onSubmitProof, onVote, onDistribute, onViewDetail, onRequestToJoin }) {
  if (loading) {
    return <p className="loading-text">Loading challenges...</p>;
  }

  if (challenges.length === 0) {
    return <p className="empty-text">No challenges yet. Create one to get started!</p>;
  }

  return (
    <div className="challenges-grid">
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

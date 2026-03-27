import React from 'react';
import { Phase, PHASE_LABELS, PHASE_BADGE_CLASS, PHASE_CARD_CLASS, formatUSDC } from '../utils/constants';

function ChallengeCard({
  challenge,
  onJoin,
  onSubmitProof,
  onVote,
  onDistribute,
  onViewDetail,
  onRequestToJoin,
  loading,
}) {
  const phase = challenge.phase;
  const phaseLabel = PHASE_LABELS[phase] || 'Unknown';
  const badgeClass = PHASE_BADGE_CLASS[phase] || 'badge-completed';
  const cardClass = PHASE_CARD_CLASS[phase] || 'card';

  const formatShortDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    if (onViewDetail) onViewDetail(challenge);
  };

  // Determine action button
  const renderAction = () => {
    // Voting phase — cast vote
    if ((phase === Phase.Voting || phase === Phase.GracePeriod) && challenge.hasSubmitted && !challenge.hasVoted) {
      return (
        <button className="btn btn-teal" style={{ padding: 10 }} onClick={() => onVote(challenge)} disabled={loading}>
          Cast your vote
        </button>
      );
    }

    // Proof submission
    if ((phase === Phase.Joining || phase === Phase.Active || phase === Phase.ProofSubmission) && challenge.hasJoined && !challenge.hasSubmitted) {
      return (
        <button className="btn btn-pink" style={{ padding: 10 }} onClick={() => onSubmitProof(challenge)} disabled={loading}>
          Submit your proof
        </button>
      );
    }

    // Distribute rewards
    if (phase === Phase.Completed && !challenge.isDistributed) {
      return (
        <button className="btn btn-mint" style={{ padding: 10 }} onClick={() => onDistribute(challenge.id)} disabled={loading}>
          Distribute rewards
        </button>
      );
    }

    // Join — public
    if (phase === Phase.Joining && !challenge.hasJoined && !challenge.isPrivate) {
      return (
        <button className="btn btn-pink" style={{ padding: 10 }} onClick={() => onJoin(challenge.id, challenge.stakeAmount)} disabled={loading}>
          Join challenge
        </button>
      );
    }

    // Join — private
    if (phase === Phase.Joining && !challenge.hasJoined && challenge.isPrivate) {
      if (challenge.isApproved) {
        return (
          <button className="btn btn-pink" style={{ padding: 10 }} onClick={() => onJoin(challenge.id, challenge.stakeAmount)} disabled={loading}>
            Join challenge
          </button>
        );
      }
      if (challenge.hasRequested) {
        return (
          <button className="btn btn-neutral" style={{ padding: 10 }} disabled>
            Request pending
          </button>
        );
      }
      return (
        <button className="btn btn-pink" style={{ padding: 10 }} onClick={() => onRequestToJoin(challenge.id)} disabled={loading}>
          Request to join
        </button>
      );
    }

    return null;
  };

  // Subtitle: participants + pot
  const subtitle = `${challenge.participantCount} participant${challenge.participantCount !== 1 ? 's' : ''} · ${formatUSDC(challenge.totalStaked)} USDC pot`;

  // Muted line: proof due date or countdown
  const getMutedLine = () => {
    if (phase === Phase.ProofSubmission || phase === Phase.Active) {
      return `Proof due ${formatShortDate(challenge.proofDeadline)}${challenge.hasSubmitted ? '' : ' · None submitted yet'}`;
    }
    if (phase === Phase.Voting || phase === Phase.GracePeriod) {
      return `Vote closes ${formatShortDate(challenge.voteDeadline)}`;
    }
    return null;
  };

  const mutedLine = getMutedLine();

  return (
    <div
      className={cardClass}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-header">
        <div>
          <p className="card-title">{challenge.goal}</p>
          <p className="card-subtitle">{subtitle}</p>
        </div>
        <div className="card-badges">
          {challenge.isPrivate && <span className="badge badge-private">Private</span>}
          <span className={`badge ${badgeClass}`}>{phaseLabel}</span>
        </div>
      </div>

      <div className="card-tags">
        {challenge.hasJoined && <span className="badge badge-joined">Joined</span>}
        {challenge.hasSubmitted && <span className="badge badge-proof">Proof submitted</span>}
        {challenge.hasVoted && <span className="badge badge-voted">Voted</span>}
      </div>

      {mutedLine && !renderAction() && (
        <p className="card-muted">{mutedLine}</p>
      )}

      {renderAction()}
    </div>
  );
}

export default ChallengeCard;

import React from 'react';
import { Phase, PHASE_LABELS, PHASE_COLORS, formatUSDC } from '../utils/constants';

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
  const phaseColor = PHASE_COLORS[phase] || '#607d8b';

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getCountdown = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const mins = Math.floor((diff % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Determine the "next deadline" to show countdown for
  const getActiveDeadline = () => {
    switch (phase) {
      case Phase.Joining:
        return { label: 'Join closes in', time: challenge.joinDeadline };
      case Phase.Active:
        return { label: 'Activity ends in', time: challenge.deadline };
      case Phase.ProofSubmission:
        return { label: 'Proof deadline in', time: challenge.proofDeadline };
      case Phase.Voting:
        return { label: 'Vote deadline in', time: challenge.voteDeadline };
      case Phase.GracePeriod:
        return { label: 'Grace ends in', time: challenge.graceDeadline };
      default:
        return null;
    }
  };

  const activeDeadline = getActiveDeadline();

  const handleCardClick = (e) => {
    // Don't trigger if clicking a button
    if (e.target.closest('button')) return;
    if (onViewDetail) onViewDetail(challenge);
  };

  return (
    <div
      className="challenge-card clickable-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      <div className="card-header">
        <h3>{challenge.goal}</h3>
        <div className="card-badges">
          {challenge.isPrivate && (
            <span className="private-badge">Private</span>
          )}
          <span className="phase-badge" style={{ backgroundColor: phaseColor }}>
            {phaseLabel}
          </span>
        </div>
      </div>

      <div className="card-details">
        <p><strong>Stake:</strong> {formatUSDC(challenge.stakeAmount)} USDC</p>
        <p><strong>Participants:</strong> {challenge.participantCount}</p>
        <p><strong>Total Pot:</strong> {formatUSDC(challenge.totalStaked)} USDC</p>
        <p><strong>Activity Deadline:</strong> {formatDate(challenge.deadline)}</p>
      </div>

      {activeDeadline && (
        <div className="countdown">
          {activeDeadline.label}: <strong>{getCountdown(activeDeadline.time)}</strong>
        </div>
      )}

      <div className="card-actions">
        {/* Public challenge join button */}
        {phase === Phase.Joining && !challenge.hasJoined && !challenge.isPrivate && (
          <button
            onClick={() => onJoin(challenge.id, challenge.stakeAmount)}
            disabled={loading}
            className="join-btn"
          >
            Join Challenge
          </button>
        )}

        {/* Private challenge: request to join / pending / approved */}
        {phase === Phase.Joining && !challenge.hasJoined && challenge.isPrivate && (
          <>
            {!challenge.hasRequested && !challenge.isApproved && (
              <button
                onClick={() => onRequestToJoin(challenge.id)}
                disabled={loading}
                className="join-btn request-btn"
              >
                Request to Join
              </button>
            )}
            {challenge.hasRequested && !challenge.isApproved && (
              <button disabled className="join-btn pending-request-btn">
                Request Pending
              </button>
            )}
            {challenge.isApproved && (
              <button
                onClick={() => onJoin(challenge.id, challenge.stakeAmount)}
                disabled={loading}
                className="join-btn"
              >
                Join Challenge
              </button>
            )}
            {challenge.hasInviteCode && !challenge.isApproved && (
              <button
                onClick={() => onViewDetail(challenge)}
                disabled={loading}
                className="join-btn code-btn"
              >
                Join with Code
              </button>
            )}
          </>
        )}

        {/* Submit Proof button: during Active or ProofSubmission phase, joined, not submitted */}
        {(phase === Phase.Active || phase === Phase.ProofSubmission) &&
          challenge.hasJoined &&
          !challenge.hasSubmitted && (
            <button
              onClick={() => onSubmitProof(challenge)}
              disabled={loading}
              className="proof-btn"
            >
              Submit Proof
            </button>
          )}

        {/* Vote button: during Voting or GracePeriod, has submitted proof, hasn't voted */}
        {(phase === Phase.Voting || phase === Phase.GracePeriod) &&
          challenge.hasSubmitted &&
          !challenge.hasVoted && (
            <button
              onClick={() => onVote(challenge)}
              disabled={loading}
              className="vote-btn"
            >
              Vote on Proofs
            </button>
          )}

        {/* Distribute button: after grace period (Completed phase, not distributed) */}
        {phase === Phase.Completed && !challenge.isDistributed && (
          <button
            onClick={() => onDistribute(challenge.id)}
            disabled={loading}
            className="distribute-btn"
          >
            Distribute Rewards
          </button>
        )}

        {challenge.hasJoined && (
          <span className="joined-badge">Joined</span>
        )}

        {challenge.hasSubmitted && (
          <span className="submitted-badge">Proof Submitted</span>
        )}

        {challenge.hasVoted && (
          <span className="voted-badge">Voted</span>
        )}
      </div>
    </div>
  );
}

export default ChallengeCard;

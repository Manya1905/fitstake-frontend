import React, { useState, useEffect, useCallback } from 'react';
import { formatUSDC, Phase, PHASE_LABELS, PHASE_COLORS } from '../utils/constants';

function ProfilePanel({ contract, address, userEmail, onClose }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [payoutDetails, setPayoutDetails] = useState({});
  const [loadingPayout, setLoadingPayout] = useState(null);

  const loadChallenges = useCallback(async () => {
    if (!contract || !address) return;
    setLoading(true);
    try {
      const count = await contract.challengeCount();
      const joined = [];

      for (let i = 1; i <= Number(count); i++) {
        const hasJoined = await contract.hasJoinedChallenge(i, address);
        if (!hasJoined) continue;

        const c = await contract.getChallenge(i);
        const phase = Number(await contract.getChallengePhase(i));
        const hasSubmitted = await contract.hasSubmittedProof(i, address);

        let forVotes = 0;
        let againstVotes = 0;
        try {
          const [f, a] = await contract.getVoteCounts(i, address);
          forVotes = Number(f);
          againstVotes = Number(a);
        } catch {
          // may fail if no votes yet
        }

        // Determine won/lost for completed challenges
        let outcome = null;
        if (phase === Phase.Completed) {
          const successful = hasSubmitted && (forVotes >= againstVotes);
          outcome = successful ? 'won' : 'lost';
        }

        joined.push({
          id: Number(c.id),
          goal: c.goal,
          phase,
          stakeAmount: c.stakeAmount,
          totalStaked: c.totalStaked,
          participantCount: Number(c.participantCount),
          isDistributed: c.isDistributed,
          hasSubmitted,
          forVotes,
          againstVotes,
          outcome,
        });
      }

      setChallenges(joined);
    } catch (error) {
      console.error('Error loading profile challenges:', error);
    }
    setLoading(false);
  }, [contract, address]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const loadPayoutDetails = async (challenge) => {
    if (payoutDetails[challenge.id]) return;
    setLoadingPayout(challenge.id);
    try {
      const addrs = await contract.getParticipants(challenge.id);
      let voterSuccessCount = 0;
      let nonVoterSuccessCount = 0;
      let failCount = 0;
      let userSucceeded = false;
      let userVoted = false;

      for (const addr of addrs) {
        const submitted = await contract.hasSubmittedProof(challenge.id, addr);
        const [f, a] = await contract.getVoteCounts(challenge.id, addr);
        const forV = Number(f);
        const againstV = Number(a);
        const voted = await contract.hasVotedAtAll(challenge.id, addr);
        const successful = submitted && (forV >= againstV);

        if (successful) {
          if (voted) {
            voterSuccessCount++;
          } else {
            nonVoterSuccessCount++;
          }
        } else {
          failCount++;
        }

        if (addr.toLowerCase() === address.toLowerCase()) {
          userSucceeded = successful;
          userVoted = voted;
        }
      }

      const stakeAmount = Number(challenge.stakeAmount);
      const losersPool = failCount * stakeAmount;
      let payout = 0;

      if (userSucceeded) {
        if (voterSuccessCount > 0 && userVoted) {
          payout = stakeAmount + (losersPool / voterSuccessCount);
        } else if (voterSuccessCount === 0) {
          const totalSucceeded = nonVoterSuccessCount;
          payout = totalSucceeded > 0 ? stakeAmount + (losersPool / totalSucceeded) : stakeAmount;
        } else {
          // Succeeded but didn't vote — only get stake back
          payout = stakeAmount;
        }
      }

      const net = payout - stakeAmount;
      setPayoutDetails((prev) => ({
        ...prev,
        [challenge.id]: { payout, net, stakeAmount, userSucceeded },
      }));
    } catch (error) {
      console.error('Error loading payout details:', error);
    }
    setLoadingPayout(null);
  };

  const handleCardClick = (challenge) => {
    if (challenge.phase !== Phase.Completed) return;
    if (expandedId === challenge.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(challenge.id);
    loadPayoutDetails(challenge);
  };

  const active = challenges.filter((c) => c.phase !== Phase.Completed);
  const completed = challenges.filter((c) => c.phase === Phase.Completed);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>Profile</h2>
          <button className="profile-close-btn" onClick={onClose}>&times;</button>
        </div>
        <p className="profile-email">{userEmail || `${address.slice(0, 6)}...${address.slice(-4)}`}</p>

        {loading ? (
          <p className="profile-loading">Loading your challenges...</p>
        ) : challenges.length === 0 ? (
          <p className="profile-empty">No challenges yet</p>
        ) : (
          <>
            {active.length > 0 && (
              <div className="profile-section">
                <h3 className="profile-section-title">Active Challenges</h3>
                {active.map((c) => (
                  <div key={c.id} className="profile-challenge-card">
                    <div className="profile-card-top">
                      <span className="profile-goal">{c.goal}</span>
                      <span
                        className="phase-badge"
                        style={{ backgroundColor: PHASE_COLORS[c.phase] }}
                      >
                        {PHASE_LABELS[c.phase]}
                      </span>
                    </div>
                    {c.hasSubmitted && (c.forVotes > 0 || c.againstVotes > 0) && (
                      <div className="profile-vote-counts">
                        <span className="vote-stats-approved">&#10003; {c.forVotes}</span>
                        <span className="vote-stats-rejected">&#10005; {c.againstVotes}</span>
                      </div>
                    )}
                    {c.hasSubmitted && c.forVotes === 0 && c.againstVotes === 0 && (
                      <p className="profile-no-votes">No votes yet</p>
                    )}
                    {!c.hasSubmitted && (
                      <p className="profile-no-votes">Proof not submitted</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {completed.length > 0 && (
              <div className="profile-section">
                <h3 className="profile-section-title">Completed</h3>
                {completed.map((c) => {
                  const isExpanded = expandedId === c.id;
                  const details = payoutDetails[c.id];
                  const isLoadingThis = loadingPayout === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`profile-challenge-card clickable`}
                      onClick={() => handleCardClick(c)}
                    >
                      <div className="profile-card-top">
                        <span className="profile-goal">{c.goal}</span>
                        <span className={`profile-outcome ${c.outcome === 'won' ? 'profile-outcome-won' : 'profile-outcome-lost'}`}>
                          {c.outcome === 'won' ? 'Won' : 'Lost'}
                        </span>
                      </div>

                      {!isExpanded && !details && (
                        <p className="profile-tap-hint">Tap to see details</p>
                      )}

                      {isExpanded && isLoadingThis && (
                        <p className="profile-loading-detail">Calculating payout...</p>
                      )}

                      {details && (
                        <div className="profile-payout-detail">
                          {details.userSucceeded ? (
                            <>
                              <span className="profile-payout-amount won">
                                +{formatUSDC(details.net)} USDC earned
                              </span>
                              <span className="profile-payout-breakdown">
                                Staked {formatUSDC(details.stakeAmount)}, got back {formatUSDC(details.payout)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="profile-payout-amount lost">
                                -{formatUSDC(details.stakeAmount)} USDC (stake lost)
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="profile-close-section">
          <button onClick={onClose} className="cancel-btn" style={{ width: '100%' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePanel;

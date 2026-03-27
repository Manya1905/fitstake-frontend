import React, { useState, useEffect, useCallback } from 'react';
import { formatUSDC, Phase } from '../utils/constants';

function DashboardHistory({ contract, address }) {
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
      const completed = [];

      for (let i = 1; i <= Number(count); i++) {
        const hasJoined = await contract.hasJoinedChallenge(i, address);
        if (!hasJoined) continue;

        const phase = Number(await contract.getChallengePhase(i));
        if (phase !== Phase.Completed) continue;

        const c = await contract.getChallenge(i);
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

        const successful = hasSubmitted && (forVotes >= againstVotes);
        const outcome = successful ? 'won' : 'lost';

        completed.push({
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

      setChallenges(completed);
    } catch (error) {
      console.error('Error loading history:', error);
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
          if (voted) voterSuccessCount++;
          else nonVoterSuccessCount++;
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

  const handleRowClick = (challenge) => {
    if (expandedId === challenge.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(challenge.id);
    loadPayoutDetails(challenge);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
        <div className="grid-3 mb-18">
          <div className="skeleton" style={{ height: 70, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 70, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 70, borderRadius: 12 }} />
        </div>
        <div className="skeleton" style={{ height: 50, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 50, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 50, borderRadius: 8 }} />
      </div>
    );
  }

  const wonCount = challenges.filter((c) => c.outcome === 'won').length;
  const totalNet = Object.values(payoutDetails).reduce((sum, d) => sum + d.net, 0);

  return (
    <div>
      {/* Stats summary */}
      <div className="grid-3 mb-18">
        <div className="stat-card">
          <p className="stat-number" style={{ color: 'var(--text-primary)' }}>{challenges.length}</p>
          <p className="stat-label">Completed</p>
        </div>
        <div className="stat-card">
          <p className="stat-number" style={{ color: 'var(--color-mint)' }}>{wonCount}</p>
          <p className="stat-label">Won</p>
        </div>
        <div className="stat-card">
          <p className="stat-number" style={{ color: totalNet >= 0 ? 'var(--color-pink)' : 'var(--color-pink)' }}>
            {Object.keys(payoutDetails).length > 0 ? (totalNet >= 0 ? '+' : '') + formatUSDC(totalNet) : '—'}
          </p>
          <p className="stat-label">USDC net</p>
        </div>
      </div>

      {/* History list */}
      {challenges.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No completed challenges</p>
          <p className="empty-body">Your completed challenges will appear here.</p>
        </div>
      ) : (
        challenges.map((c) => {
          const details = payoutDetails[c.id];
          const isExpanded = expandedId === c.id;
          const isLoadingThis = loadingPayout === c.id;

          return (
            <div key={c.id} className="history-row" onClick={() => handleRowClick(c)}>
              <div>
                <p className="history-title">{c.goal}</p>
                {details && details.userSucceeded ? (
                  <>
                    <p className="history-gain">+{formatUSDC(details.net)} USDC earned</p>
                    <p className="history-detail">Staked {formatUSDC(details.stakeAmount)} · got back {formatUSDC(details.payout)}</p>
                  </>
                ) : details && !details.userSucceeded ? (
                  <p className="history-loss">-{formatUSDC(details.stakeAmount)} USDC (stake lost)</p>
                ) : isExpanded && isLoadingThis ? (
                  <p className="history-detail">Calculating payout...</p>
                ) : (
                  <p className="history-detail">Tap to see details</p>
                )}
              </div>
              <span className={`badge ${c.outcome === 'won' ? 'badge-won' : 'badge-lost'}`}>
                {c.outcome === 'won' ? 'Won' : 'Lost'}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

export default DashboardHistory;

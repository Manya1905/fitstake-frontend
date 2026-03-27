import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { BACKEND_URL, formatUSDC, Phase } from '../utils/constants';
import { getAvatarColor, getInitials } from '../utils/avatarColor';
import JoinRequestsSection from './JoinRequestsSection';

function normalizeProof(raw) {
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    parsed = { text: raw };
  }
  if (parsed.media && typeof parsed.media === 'string') {
    parsed.media = [{ url: parsed.media, type: parsed.mediaType || 'image' }];
  }
  if (!parsed.media) parsed.media = [];
  return parsed;
}

function ProofViewerPanel({
  challenge, contract, address, onCastVotes, onClose, onVoted,
  onApproveRequest, onRejectRequest, onJoinWithCode, onRefresh,
}) {
  const [screen, setScreen] = useState('roster');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localVotes, setLocalVotes] = useState({});
  const [onChainVotes, setOnChainVotes] = useState({});
  const [showVoteSheet, setShowVoteSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [emailMap, setEmailMap] = useState({});
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joiningWithCode, setJoiningWithCode] = useState(false);
  const [myVoteStats, setMyVoteStats] = useState(null);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  const [sheetChoice, setSheetChoice] = useState(null);
  const [sheetReason, setSheetReason] = useState('');
  const [isChangingVote, setIsChangingVote] = useState(false);

  const isCreator = address && challenge.creator && address.toLowerCase() === challenge.creator.toLowerCase();
  const storedInviteCode = isCreator ? localStorage.getItem(`fitstake_invite_${challenge.id}`) : null;
  const [codeCopied, setCodeCopied] = useState(false);

  const canVote = (challenge.phase === Phase.Voting || challenge.phase === Phase.GracePeriod) &&
    challenge.hasSubmitted;

  const loadParticipants = useCallback(async (silent = false) => {
    if (!contract) return;
    if (!silent) setLoading(true);
    try {
      let addrs;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          addrs = await contract.getParticipants(challenge.id);
          break;
        } catch (err) {
          console.error(`getParticipants attempt ${attempt}/3 failed:`, err.message);
          if (attempt === 3) throw err;
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      let emailMap = {};
      try {
        const emailRes = await fetch(`${BACKEND_URL}/api/users/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addresses: [...addrs] }),
        });
        const emailData = await emailRes.json();
        emailMap = emailData.users || {};
      } catch (err) {
        console.error('Error fetching user emails:', err);
      }

      let backendVotes = {};
      try {
        const res = await fetch(`${BACKEND_URL}/api/votes/${challenge.id}/${address}`);
        const data = await res.json();
        if (data.votes) {
          for (const v of data.votes) {
            backendVotes[v.targetAddress.toLowerCase()] = { vote: v.vote, reason: v.reason };
          }
        }
      } catch (err) {
        console.error('Error fetching backend votes:', err);
      }

      const participantData = [];
      const chainVotes = {};
      const localV = {};

      for (const addr of addrs) {
        const isCurrentUser = addr.toLowerCase() === address.toLowerCase();
        const isChallengeCreator = addr.toLowerCase() === challenge.creator.toLowerCase();
        const hasSubmitted = await contract.hasSubmittedProof(challenge.id, addr);

        let proofData = null;
        let proofs = [];
        if (hasSubmitted) {
          const raw = await contract.getUserProof(challenge.id, addr);
          proofData = normalizeProof(raw);
          proofs = proofData.media.map((m, i) => ({
            label: `Proof ${i + 1}`,
            type: m.type || 'image',
            url: m.url,
          }));
        }

        let votedOnChain = false;
        if (!isCurrentUser) {
          try {
            const [hasVoted] = await contract.getVoteStatus(challenge.id, address, addr);
            votedOnChain = hasVoted;
            if (hasVoted) {
              chainVotes[addr.toLowerCase()] = true;
            }
          } catch {
            // getVoteStatus might fail if user hasn't submitted proof
          }
        }

        const addrLower = addr.toLowerCase();
        if (backendVotes[addrLower]) {
          localV[addrLower] = backendVotes[addrLower];
        }

        const email = emailMap[addr.toLowerCase()] || null;

        participantData.push({
          address: addr,
          displayAddress: email || `${addr.slice(0, 6)}...${addr.slice(-4)}`,
          email,
          isCurrentUser,
          isCreator: isChallengeCreator,
          hasSubmitted,
          caption: proofData?.text || null,
          proofs,
          fitness: proofData?.fitness || null,
          votedOnChain,
        });
      }

      try {
        const [forVotes, againstVotes] = await contract.getVoteCounts(challenge.id, address);
        const votesRes = await fetch(`${BACKEND_URL}/api/votes/${challenge.id}/for/${address}`);
        const votesData = await votesRes.json();
        const reasons = (votesData.votes || [])
          .filter((v) => v.vote === 'rejected' && v.reason)
          .map((v) => v.reason);
        setMyVoteStats({
          forVotes: Number(forVotes),
          againstVotes: Number(againstVotes),
          rejectionReasons: reasons,
        });
      } catch (err) {
        console.error('Error loading own vote stats:', err);
      }

      setParticipants(participantData);
      setOnChainVotes(chainVotes);
      setLocalVotes(localV);

      if (isCreator && challenge.isPrivate) {
        try {
          const requests = await contract.getJoinRequests(challenge.id);
          setJoinRequests([...requests]);
          if (requests.length > 0) {
            try {
              const reqEmailRes = await fetch(`${BACKEND_URL}/api/users/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addresses: [...requests] }),
              });
              const reqEmailData = await reqEmailRes.json();
              if (reqEmailData.users) {
                emailMap = { ...emailMap, ...reqEmailData.users };
              }
            } catch (err) {
              console.error('Error fetching join request emails:', err);
            }
          }
        } catch {
          // getJoinRequests may not exist on older contracts
        }
      }
      setEmailMap(emailMap);
    } catch (error) {
      console.error('Error loading participants:', error);
      if (!silent) toast.error('Failed to load participants');
    }
    if (!silent) setLoading(false);
  }, [contract, challenge, address, isCreator]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  useEffect(() => {
    const interval = setInterval(() => loadParticipants(true), 15000);
    return () => clearInterval(interval);
  }, [loadParticipants]);

  const pendingVoteCount = Object.keys(localVotes).filter(
    (addr) => !onChainVotes[addr]
  ).length;

  const getMyVote = (addr) => {
    const addrLower = addr.toLowerCase();
    return localVotes[addrLower] || null;
  };

  // ─── Roster Screen ─────────────────────────────────────

  const handleRowClick = (participant) => {
    if (!participant.hasSubmitted) return;
    setSelectedParticipant(participant);
    setScreen('proof');
  };

  // ─── Proof View ────────────────────────────────────────

  const handleBackToRoster = () => {
    setScreen('roster');
    setSelectedParticipant(null);
  };

  // ─── Vote Sheet ────────────────────────────────────────

  const openVoteSheet = (changing) => {
    setIsChangingVote(changing);
    if (changing && selectedParticipant) {
      const existing = getMyVote(selectedParticipant.address);
      if (existing) {
        setSheetChoice(existing.vote);
        setSheetReason(existing.reason || '');
      } else {
        setSheetChoice(null);
        setSheetReason('');
      }
    } else {
      setSheetChoice(null);
      setSheetReason('');
    }
    setShowVoteSheet(true);
  };

  const closeVoteSheet = () => {
    setShowVoteSheet(false);
    setSheetChoice(null);
    setSheetReason('');
  };

  const confirmVote = async () => {
    if (!selectedParticipant) return;
    if (!sheetChoice) return;
    if (sheetChoice === 'rejected' && sheetReason.length < 20) return;

    const targetAddr = selectedParticipant.address.toLowerCase();

    try {
      await fetch(`${BACKEND_URL}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          voterAddress: address,
          targetAddress: targetAddr,
          vote: sheetChoice,
          reason: sheetChoice === 'rejected' ? sheetReason : null,
        }),
      });
    } catch (err) {
      console.error('Error saving vote to backend:', err);
    }

    setLocalVotes((prev) => ({
      ...prev,
      [targetAddr]: {
        vote: sheetChoice,
        reason: sheetChoice === 'rejected' ? sheetReason : null,
      },
    }));

    closeVoteSheet();
  };

  // ─── Batch Submit ──────────────────────────────────────

  const handleBatchSubmit = async () => {
    setShowBatchConfirm(false);
    const pending = Object.entries(localVotes).filter(
      ([addr]) => !onChainVotes[addr]
    );

    if (pending.length === 0) {
      toast.error('No pending votes to submit');
      return;
    }

    setSubmitting(true);
    try {
      toast.loading('Submitting votes on-chain...', { id: 'batchVote' });
      const addresses = pending.map(([addr]) => addr);
      const approvals = pending.map(([, v]) => v.vote === 'approved');

      await onCastVotes(challenge.id, addresses, approvals);

      toast.success('Votes submitted!', { id: 'batchVote' });

      const newChain = { ...onChainVotes };
      for (const addr of addresses) {
        newChain[addr] = true;
      }
      setOnChainVotes(newChain);

      if (onVoted) onVoted();
    } catch (error) {
      console.error('Error submitting votes:', error);
      toast.error('Failed: ' + (error.reason || error.message), { id: 'batchVote' });
    }
    setSubmitting(false);
  };

  // ─── Join Management ────────────────────────────────────

  const handleJoinWithCode = async () => {
    if (!inviteCodeInput.trim()) {
      toast.error('Please enter an invite code');
      return;
    }
    setJoiningWithCode(true);
    try {
      toast.loading('Joining with invite code...', { id: 'joinCode' });
      await onJoinWithCode(challenge.id, inviteCodeInput.trim(), challenge.stakeAmount);
      toast.success('Joined challenge!', { id: 'joinCode' });
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      toast.error('Failed: ' + (error.reason || error.message), { id: 'joinCode' });
    }
    setJoiningWithCode(false);
  };

  const handleApprove = async (challengeId, userAddress) => {
    await onApproveRequest(challengeId, userAddress);
    loadParticipants();
  };

  const handleReject = async (challengeId, userAddress) => {
    await onRejectRequest(challengeId, userAddress);
    loadParticipants();
  };

  const isConfirmEnabled = sheetChoice === 'approved' ||
    (sheetChoice === 'rejected' && sheetReason.length >= 20);

  // ─── Render ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="proof-viewer-screen">
        <div className="nav">
          <button className="btn-back" onClick={onClose}>&larr; Back</button>
          <span className="nav-title">Roster</span>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="proof-viewer-screen">

      {/* ═══ ROSTER SCREEN ═══ */}
      {screen === 'roster' && (
        <>
          <div className="nav">
            <button className="btn-back" onClick={onClose}>&larr; Back</button>
            <span className="nav-title">Roster</span>
            <div style={{ width: 60 }} />
          </div>

          <div className="proof-viewer-body">
            {/* Challenge header */}
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{challenge.goal}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {participants.length} participant{participants.length !== 1 ? 's' : ''} &middot; {formatUSDC(challenge.totalStaked)} USDC pot
              </p>
            </div>

            {/* Creator invite code */}
            {storedInviteCode && (
              <div className="invite-code-box">
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>Your Invite Code</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code className="invite-code">{storedInviteCode}</code>
                  <button
                    className="btn btn-neutral btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(storedInviteCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                  >
                    {codeCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Join with invite code */}
            {challenge.isPrivate && challenge.hasInviteCode && !challenge.hasJoined && challenge.phase === Phase.Joining && (
              <div className="card" style={{ marginBottom: 14 }}>
                <p className="section-label">Join with Invite Code</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter invite code"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={handleJoinWithCode}
                    disabled={joiningWithCode}
                    className="btn btn-teal btn-sm"
                  >
                    {joiningWithCode ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            )}

            {/* Join requests */}
            {isCreator && challenge.isPrivate && (
              <JoinRequestsSection
                challenge={challenge}
                joinRequests={joinRequests}
                emailMap={emailMap}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}

            {/* Participant roster */}
            <div className="roster-list">
              {participants.map((p) => {
                const vote = getMyVote(p.address);
                const isOnChain = onChainVotes[p.address.toLowerCase()];
                const isClickable = p.hasSubmitted;

                return (
                  <div
                    key={p.address}
                    className={`roster-row ${isClickable ? 'clickable' : ''}`}
                    onClick={() => isClickable && handleRowClick(p)}
                  >
                    <div
                      className="avatar"
                      style={{ backgroundColor: getAvatarColor(p.address), fontSize: 12, width: 36, height: 36 }}
                    >
                      {getInitials(p.address, p.email)}
                    </div>

                    <div className="roster-info">
                      <span className="roster-address">{p.displayAddress}</span>
                      <div className="roster-sub">
                        {p.hasSubmitted
                          ? <span style={{ color: 'var(--color-mint)' }}>{p.proofs.length || 1} proof{p.proofs.length !== 1 ? 's' : ''}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>No proof</span>}
                        {p.isCurrentUser && <span className="badge badge-you">You</span>}
                        {p.isCreator && <span className="badge badge-creator">Creator</span>}
                        {vote && vote.vote === 'approved' && (
                          <span className={`badge ${isOnChain ? 'badge-voted' : 'badge-staged'}`}>
                            &#10003; {isOnChain ? 'Approved' : 'Staged'}
                          </span>
                        )}
                        {vote && vote.vote === 'rejected' && (
                          <span className={`badge ${isOnChain ? 'badge-lost' : 'badge-staged'}`}>
                            &#10005; {isOnChain ? 'Rejected' : 'Staged'}
                          </span>
                        )}
                      </div>
                    </div>

                    {isClickable && <span className="roster-chevron">&rsaquo;</span>}
                  </div>
                );
              })}
            </div>

            {/* Close button */}
            <button className="btn btn-ghost-pink" onClick={onClose} style={{ width: '100%', marginTop: 14 }}>
              Close
            </button>
          </div>

          {/* Batch vote bar */}
          {canVote && pendingVoteCount > 0 && (
            <div className="batch-vote-bar">
              <span className="batch-vote-count">{pendingVoteCount} vote{pendingVoteCount !== 1 ? 's' : ''} staged</span>
              <button
                className="btn btn-pink btn-sm"
                onClick={() => setShowBatchConfirm(true)}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : `Submit ${pendingVoteCount} vote${pendingVoteCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* Batch confirm dialog */}
          {showBatchConfirm && (
            <div className="confirm-overlay" onClick={() => setShowBatchConfirm(false)}>
              <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 8px' }}>Submit votes on-chain?</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 18px' }}>
                  This will submit {pendingVoteCount} vote{pendingVoteCount !== 1 ? 's' : ''} to the blockchain. This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-neutral" style={{ flex: 1 }} onClick={() => setShowBatchConfirm(false)}>Cancel</button>
                  <button className="btn btn-pink" style={{ flex: 1 }} onClick={handleBatchSubmit}>Submit votes</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ PROOF VIEW SCREEN ═══ */}
      {screen === 'proof' && selectedParticipant && (
        <>
          <div className="nav">
            <button className="btn-back" onClick={handleBackToRoster}>&larr; Roster</button>
            <span className="nav-title">Proof</span>
            <div style={{ width: 60 }} />
          </div>

          <div className="proof-viewer-body">
            {/* Submitter info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                className="avatar"
                style={{ backgroundColor: getAvatarColor(selectedParticipant.address) }}
              >
                {getInitials(selectedParticipant.address, selectedParticipant.email)}
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedParticipant.displayAddress}</span>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  {selectedParticipant.isCurrentUser && <span className="badge badge-you">You</span>}
                  {selectedParticipant.isCreator && <span className="badge badge-creator">Creator</span>}
                </div>
              </div>
            </div>

            {/* Own proof: vote stats */}
            {selectedParticipant.isCurrentUser && myVoteStats && (
              <div className="card" style={{ marginBottom: 14 }}>
                <p className="section-label">Your Vote Stats</p>
                {(myVoteStats.forVotes > 0 || myVoteStats.againstVotes > 0) ? (
                  <>
                    {/* Vote stat bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-mint)', fontWeight: 600 }}>
                        {myVoteStats.forVotes}
                      </span>
                      <div className="vote-stat-bar-track">
                        <div
                          className="vote-stat-bar-fill"
                          style={{
                            width: `${(myVoteStats.forVotes / (myVoteStats.forVotes + myVoteStats.againstVotes)) * 100}%`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--color-pink)', fontWeight: 600 }}>
                        {myVoteStats.againstVotes}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>Approved</span>
                      <span>Rejected</span>
                    </div>
                    {/* Rejection reasons */}
                    {myVoteStats.rejectionReasons.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Rejection reasons (anonymous)</p>
                        {myVoteStats.rejectionReasons.map((reason, i) => (
                          <div key={i} className="rejection-reason-item">
                            <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic' }}>"{reason}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No votes received yet</p>
                )}
              </div>
            )}

            {/* Proof caption */}
            {selectedParticipant.caption && (
              <div className="card" style={{ marginBottom: 14, fontStyle: 'italic', fontSize: 14, color: 'var(--text-secondary)' }}>
                "{selectedParticipant.caption}"
              </div>
            )}

            {/* Proof media */}
            <div className="proof-media-list">
              {selectedParticipant.proofs.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No media submitted</p>
              )}
              {selectedParticipant.proofs.map((proof, i) => (
                <div key={i} className="proof-media-item">
                  <span className="badge badge-proof" style={{ marginBottom: 6, display: 'inline-block' }}>{proof.label}</span>
                  {proof.type === 'video' ? (
                    <video
                      src={proof.url}
                      controls
                      playsInline
                      className="proof-media-video"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <img
                      src={proof.url}
                      alt={proof.label}
                      className="proof-media-img"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Fitness data */}
            {selectedParticipant.fitness && selectedParticipant.fitness.length > 0 && (
              <div className="fitness-data-card" style={{ marginTop: 14 }}>
                <strong style={{ fontSize: 13 }}>Fitness data</strong>
                {selectedParticipant.fitness.map((a, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    <strong>{a.name || a.type || 'Workout'}</strong>
                    {a.duration ? ` · ${Math.round(a.duration / 60)} min` : ''}
                    {a.distance ? ` · ${(a.distance / 1000).toFixed(2)} km` : ''}
                    {a.calories ? ` · ${a.calories} cal` : ''}
                  </div>
                ))}
              </div>
            )}

            {/* Vote action — others' proof */}
            {canVote && !selectedParticipant.isCurrentUser && (
              <div style={{ marginTop: 18 }}>
                {(() => {
                  const vote = getMyVote(selectedParticipant.address);
                  const isOnChain = onChainVotes[selectedParticipant.address.toLowerCase()];

                  if (!vote) {
                    return (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          className="btn btn-teal"
                          style={{ flex: 1 }}
                          onClick={() => { setSheetChoice('approved'); openVoteSheet(false); }}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-teal"
                          style={{ flex: 1 }}
                          onClick={() => { setSheetChoice('rejected'); openVoteSheet(false); }}
                        >
                          Reject
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="card">
                      <p style={{ fontSize: 14, fontWeight: 600, color: vote.vote === 'approved' ? 'var(--color-mint)' : 'var(--color-pink)' }}>
                        Your vote: {vote.vote === 'approved' ? '\u2713 Approved' : '\u2715 Rejected'}
                        {isOnChain && <span className="badge badge-voted" style={{ marginLeft: 6 }}>On-chain</span>}
                      </p>
                      {vote.vote === 'rejected' && vote.reason && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 4 }}>
                          "{vote.reason}"
                        </p>
                      )}
                      {!isOnChain && (
                        <button className="btn btn-neutral btn-sm" onClick={() => openVoteSheet(true)} style={{ marginTop: 8 }}>
                          Change vote
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Batch vote bar on proof screen too */}
          {canVote && pendingVoteCount > 0 && (
            <div className="batch-vote-bar">
              <span className="batch-vote-count">{pendingVoteCount} vote{pendingVoteCount !== 1 ? 's' : ''} staged</span>
              <button
                className="btn btn-pink btn-sm"
                onClick={() => setShowBatchConfirm(true)}
                disabled={submitting}
              >
                Submit {pendingVoteCount} vote{pendingVoteCount !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Batch confirm on proof screen */}
          {showBatchConfirm && (
            <div className="confirm-overlay" onClick={() => setShowBatchConfirm(false)}>
              <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 8px' }}>Submit votes on-chain?</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 18px' }}>
                  This will submit {pendingVoteCount} vote{pendingVoteCount !== 1 ? 's' : ''} to the blockchain.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-neutral" style={{ flex: 1 }} onClick={() => setShowBatchConfirm(false)}>Cancel</button>
                  <button className="btn btn-pink" style={{ flex: 1 }} onClick={handleBatchSubmit}>Submit votes</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ VOTE CONFIRMATION SHEET ═══ */}
      {showVoteSheet && (
        <div className="confirm-overlay" onClick={closeVoteSheet}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h3 style={{ margin: '0 0 6px' }}>
              {sheetChoice === 'rejected' ? 'Reject proof' : sheetChoice === 'approved' ? 'Approve proof' : 'Cast your vote'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              {isChangingVote
                ? 'Update your vote for this participant.'
                : sheetChoice === 'rejected'
                  ? 'Please explain why this proof is invalid.'
                  : 'Confirm that this proof is valid.'}
            </p>

            {/* Choice cards — only show if no pre-selection */}
            {!sheetChoice && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div
                  className="card"
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: '2px solid var(--color-teal)' }}
                  onClick={() => setSheetChoice('approved')}
                >
                  <span style={{ fontSize: 22 }}>&#10003;</span>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 0' }}>Approve</p>
                </div>
                <div
                  className="card"
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: '2px solid var(--color-pink)' }}
                  onClick={() => setSheetChoice('rejected')}
                >
                  <span style={{ fontSize: 22 }}>&#10005;</span>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 0' }}>Reject</p>
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {sheetChoice === 'rejected' && (
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Why is this proof invalid?</label>
                <textarea
                  className="form-textarea"
                  value={sheetReason}
                  onChange={(e) => setSheetReason(e.target.value)}
                  placeholder="Explain why this proof doesn't meet the challenge requirements..."
                  rows="3"
                />
                <span style={{
                  fontSize: 11,
                  color: sheetReason.length < 20 ? 'var(--color-pink)' : 'var(--color-mint)',
                  display: 'block', textAlign: 'right', marginTop: 4,
                }}>
                  {sheetReason.length < 20
                    ? `${sheetReason.length} / 20 min`
                    : `${sheetReason.length} chars \u2713`}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-neutral" style={{ flex: 1 }} onClick={closeVoteSheet}>
                Cancel
              </button>
              <button
                className={`btn ${sheetChoice === 'rejected' ? 'btn-danger' : 'btn-teal'}`}
                style={{ flex: 1 }}
                disabled={!isConfirmEnabled}
                onClick={confirmVote}
              >
                Stage vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProofViewerPanel;

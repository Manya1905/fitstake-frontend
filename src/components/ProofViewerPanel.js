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
  // Convert old single-media format to array
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
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joiningWithCode, setJoiningWithCode] = useState(false);

  // Vote sheet state
  const [sheetChoice, setSheetChoice] = useState(null); // 'approved' | 'rejected'
  const [sheetReason, setSheetReason] = useState('');
  const [isChangingVote, setIsChangingVote] = useState(false);

  const isCreator = address && challenge.creator && address.toLowerCase() === challenge.creator.toLowerCase();
  const storedInviteCode = isCreator ? localStorage.getItem(`fitstake_invite_${challenge.id}`) : null;
  const [codeCopied, setCodeCopied] = useState(false);

  const canVote = (challenge.phase === Phase.Voting || challenge.phase === Phase.GracePeriod) &&
    challenge.hasSubmitted;

  const loadParticipants = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const addrs = await contract.getParticipants(challenge.id);

      // Fetch backend votes for this user
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
        const isCreator = addr.toLowerCase() === challenge.creator.toLowerCase();
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

        // Check on-chain vote status (skip self)
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

        // Merge backend vote data into local votes
        const addrLower = addr.toLowerCase();
        if (backendVotes[addrLower]) {
          localV[addrLower] = backendVotes[addrLower];
        }

        participantData.push({
          address: addr,
          displayAddress: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
          isCurrentUser,
          isCreator,
          hasSubmitted,
          caption: proofData?.text || null,
          proofs,
          fitness: proofData?.fitness || null,
          votedOnChain,
        });
      }

      setParticipants(participantData);
      setOnChainVotes(chainVotes);
      setLocalVotes(localV);

      // Load join requests if creator of private challenge
      if (isCreator && challenge.isPrivate) {
        try {
          const requests = await contract.getJoinRequests(challenge.id);
          setJoinRequests([...requests]);
        } catch {
          // getJoinRequests may not exist on older contracts
        }
      }
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Failed to load participants');
    }
    setLoading(false);
  }, [contract, challenge, address, isCreator]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  // Count pending votes (local but not yet on-chain)
  const pendingVoteCount = Object.keys(localVotes).filter(
    (addr) => !onChainVotes[addr]
  ).length;

  const getMyVote = (addr) => {
    const addrLower = addr.toLowerCase();
    return localVotes[addrLower] || null;
  };

  // ─── Roster Screen ─────────────────────────────────────

  const handleRowClick = (participant) => {
    if (participant.isCurrentUser) return;
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

    // Save to backend
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

    // Update local state
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

      // Mark as on-chain
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

  // ─── Confirm button state ─────────────────────────────

  const isConfirmEnabled = sheetChoice === 'approved' ||
    (sheetChoice === 'rejected' && sheetReason.length >= 20);

  const confirmButtonLabel = sheetChoice === 'rejected' ? 'Confirm rejection' : 'Confirm vote';

  // ─── Render ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="proof-panel" onClick={(e) => e.stopPropagation()}>
          <p style={{ padding: '2rem', textAlign: 'center' }}>Loading participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="proof-panel" onClick={(e) => e.stopPropagation()}>

        {/* ═══ ROSTER SCREEN ═══ */}
        {screen === 'roster' && (
          <>
            <div className="proof-panel-header">
              <h2>{challenge.goal}</h2>
              <p className="proof-panel-meta">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} &middot; {formatUSDC(challenge.totalStaked)} USDC pot
              </p>
            </div>

            {/* Creator invite code display */}
            {storedInviteCode && (
              <div className="creator-invite-code-section">
                <h4>Your Invite Code</h4>
                <div className="creator-invite-code-row">
                  <code className="invite-code-display">{storedInviteCode}</code>
                  <button
                    className="copy-code-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(storedInviteCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                  >
                    {codeCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="form-hint">Share this code with friends so they can join your challenge.</p>
              </div>
            )}

            {/* Join with invite code */}
            {challenge.isPrivate && challenge.hasInviteCode && !challenge.hasJoined && challenge.phase === Phase.Joining && (
              <div className="invite-code-section">
                <h4>Join with Invite Code</h4>
                <div className="invite-code-input-row">
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter invite code"
                  />
                  <button
                    onClick={handleJoinWithCode}
                    disabled={joiningWithCode}
                    className="join-btn"
                  >
                    {joiningWithCode ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            )}

            {/* Join requests (creator of private challenge) */}
            {isCreator && challenge.isPrivate && (
              <JoinRequestsSection
                challenge={challenge}
                joinRequests={joinRequests}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}

            <div className="roster-list">
              {participants.map((p) => {
                const vote = getMyVote(p.address);
                const isOnChain = onChainVotes[p.address.toLowerCase()];
                const isClickable = !p.isCurrentUser && p.hasSubmitted;

                return (
                  <div
                    key={p.address}
                    className={`roster-row ${p.isCurrentUser ? 'locked' : ''} ${isClickable ? 'clickable' : ''}`}
                    onClick={() => isClickable && handleRowClick(p)}
                  >
                    <div
                      className="roster-avatar"
                      style={{ backgroundColor: getAvatarColor(p.address) }}
                    >
                      {getInitials(p.address)}
                    </div>

                    <div className="roster-info">
                      <span className="roster-address">{p.displayAddress}</span>
                      <div className="roster-sub">
                        {p.hasSubmitted
                          ? `${p.proofs.length || 1} proof${p.proofs.length !== 1 ? 's' : ''} submitted`
                          : 'No proof submitted'}
                        {p.isCurrentUser && <span className="roster-badge badge-you">You</span>}
                        {p.isCreator && <span className="roster-badge badge-creator">Creator</span>}
                        {vote && vote.vote === 'approved' && (
                          <span className={`vote-pill vote-pill-approved ${isOnChain ? '' : 'pending'}`}>
                            &#10003; Approved{!isOnChain ? ' (pending)' : ''}
                          </span>
                        )}
                        {vote && vote.vote === 'rejected' && (
                          <span className={`vote-pill vote-pill-rejected ${isOnChain ? '' : 'pending'}`}>
                            &#10005; Rejected{!isOnChain ? ' (pending)' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {isClickable && <span className="roster-chevron">&rsaquo;</span>}
                  </div>
                );
              })}
            </div>

            {/* Batch submit bar */}
            {canVote && pendingVoteCount > 0 && (
              <div className="batch-submit-bar">
                <button
                  onClick={handleBatchSubmit}
                  className="batch-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : `Submit ${pendingVoteCount} vote${pendingVoteCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}

            <div className="proof-panel-close">
              <button onClick={onClose} className="cancel-btn" style={{ width: '100%' }}>Close</button>
            </div>
          </>
        )}

        {/* ═══ PROOF VIEW SCREEN ═══ */}
        {screen === 'proof' && selectedParticipant && (
          <>
            <button className="proof-back-btn" onClick={handleBackToRoster}>
              &larr; back to roster
            </button>

            <div className="proof-user-header">
              <div
                className="roster-avatar"
                style={{ backgroundColor: getAvatarColor(selectedParticipant.address) }}
              >
                {getInitials(selectedParticipant.address)}
              </div>
              <div>
                <span className="roster-address">{selectedParticipant.displayAddress}</span>
                {selectedParticipant.isCreator && (
                  <span className="roster-badge badge-creator">Creator</span>
                )}
              </div>
            </div>

            {selectedParticipant.caption && (
              <p className="proof-caption">{selectedParticipant.caption}</p>
            )}

            <div className="proof-media-list">
              {selectedParticipant.proofs.length === 0 && (
                <p className="proof-empty-text">No media submitted</p>
              )}
              {selectedParticipant.proofs.map((proof, i) => (
                <div key={i} className="proof-media-item">
                  <span className="proof-label-badge">{proof.label}</span>
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
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Fitness data */}
            {selectedParticipant.fitness && selectedParticipant.fitness.length > 0 && (
              <div className="proof-fitness-data">
                <strong>Fitness data:</strong>
                {selectedParticipant.fitness.map((a, i) => (
                  <span key={i} className="proof-fitness-item">
                    {a.name || a.type || 'Workout'}
                    {a.duration ? ` — ${Math.round(a.duration / 60)} min` : ''}
                    {a.distance ? ` — ${(a.distance / 1000).toFixed(2)} km` : ''}
                    {a.calories ? ` — ${a.calories} cal` : ''}
                  </span>
                ))}
              </div>
            )}

            {/* Vote action bar */}
            {canVote && (
              <div className="vote-action-bar">
                {(() => {
                  const vote = getMyVote(selectedParticipant.address);
                  const isOnChain = onChainVotes[selectedParticipant.address.toLowerCase()];

                  if (!vote) {
                    return (
                      <button className="cast-vote-btn" onClick={() => openVoteSheet(false)}>
                        Cast vote
                      </button>
                    );
                  }

                  return (
                    <div className="vote-status-display">
                      <p className={`vote-status-text ${vote.vote === 'approved' ? 'approved' : 'rejected'}`}>
                        Your vote: {vote.vote === 'approved' ? '\u2713 Approved' : '\u2715 Rejected'}
                        {isOnChain && ' (on-chain)'}
                      </p>
                      {vote.vote === 'rejected' && vote.reason && (
                        <p className="vote-reason-text">{vote.reason}</p>
                      )}
                      {!isOnChain && (
                        <button className="change-vote-btn" onClick={() => openVoteSheet(true)}>
                          Change vote
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {/* ═══ VOTE CONFIRMATION SHEET ═══ */}
        {showVoteSheet && (
          <div className="vote-sheet-overlay" onClick={closeVoteSheet}>
            <div className="vote-sheet" onClick={(e) => e.stopPropagation()}>
              <h3>Cast your vote</h3>
              <p className="vote-sheet-subtitle">
                {isChangingVote
                  ? 'Update your vote for this participant.'
                  : 'Did this participant complete the challenge?'}
              </p>

              <div className="vote-option-cards">
                <div
                  className={`vote-option-card ${sheetChoice === 'approved' ? 'selected-approve' : ''}`}
                  onClick={() => setSheetChoice('approved')}
                >
                  <span className="vote-option-icon">&#10003;</span>
                  <strong>Approve</strong>
                  <span className="vote-option-desc">Valid proof</span>
                </div>
                <div
                  className={`vote-option-card ${sheetChoice === 'rejected' ? 'selected-reject' : ''}`}
                  onClick={() => setSheetChoice('rejected')}
                >
                  <span className="vote-option-icon">&#10005;</span>
                  <strong>Reject</strong>
                  <span className="vote-option-desc">Not valid</span>
                </div>
              </div>

              {/* Rejection reason field */}
              <div className={`vote-reason-field ${sheetChoice === 'rejected' ? 'open' : ''}`}>
                <label className="vote-reason-label">Why is this proof invalid? (required)</label>
                <textarea
                  className="vote-reason-textarea"
                  value={sheetReason}
                  onChange={(e) => setSheetReason(e.target.value)}
                  placeholder="Explain why this proof doesn't meet the challenge requirements..."
                  rows="3"
                />
                <span className={`vote-char-counter ${sheetReason.length < 20 ? 'under' : 'met'}`}>
                  {sheetReason.length < 20
                    ? `${sheetReason.length} / 20 min`
                    : `${sheetReason.length} chars \u2713`}
                </span>
              </div>

              <div className="vote-sheet-buttons">
                <button className="vote-sheet-cancel" onClick={closeVoteSheet}>
                  Cancel
                </button>
                <button
                  className="vote-sheet-confirm"
                  disabled={!isConfirmEnabled}
                  onClick={confirmVote}
                  style={{
                    backgroundColor: isConfirmEnabled
                      ? (sheetChoice === 'rejected' ? '#991b1b' : '#065f46')
                      : '#ccc',
                    color: isConfirmEnabled ? 'white' : '#888',
                  }}
                >
                  {confirmButtonLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProofViewerPanel;

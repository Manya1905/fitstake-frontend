import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Phase, PHASE_LABELS, PHASE_COLORS, formatUSDC } from '../utils/constants';
import JoinRequestsSection from './JoinRequestsSection';

function ChallengeDetailModal({
  challenge,
  contract,
  address,
  onClose,
  onApproveRequest,
  onRejectRequest,
  onJoinWithCode,
  onRefresh,
}) {
  const [participants, setParticipants] = useState([]);
  const [participantDetails, setParticipantDetails] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joiningWithCode, setJoiningWithCode] = useState(false);

  const isCreator = address && challenge.creator && address.toLowerCase() === challenge.creator.toLowerCase();
  const isParticipant = challenge.hasJoined;
  const canSeeProofs = !challenge.isPrivate || isParticipant;

  // Retrieve stored invite code for creator
  const storedInviteCode = isCreator ? localStorage.getItem(`fitstake_invite_${challenge.id}`) : null;
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [challenge.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDetails = async () => {
    if (!contract) return;
    setLoadingDetail(true);
    try {
      const parts = await contract.getParticipants(challenge.id);
      setParticipants(parts);

      // Load proof + vote data for each participant
      const details = [];
      for (const p of parts) {
        const hasSubmitted = await contract.hasSubmittedProof(challenge.id, p);
        let proofData = '';
        let votesFor = 0;
        let votesAgainst = 0;

        if (hasSubmitted) {
          proofData = await contract.getUserProof(challenge.id, p);
          const votes = await contract.getVoteCounts(challenge.id, p);
          votesFor = Number(votes[0]);
          votesAgainst = Number(votes[1]);
        }

        details.push({
          address: p,
          hasSubmitted,
          proofData,
          votesFor,
          votesAgainst,
        });
      }
      setParticipantDetails(details);

      // Load join requests if creator of private challenge
      if (isCreator && challenge.isPrivate) {
        const requests = await contract.getJoinRequests(challenge.id);
        setJoinRequests([...requests]);
      }
    } catch (error) {
      console.error('Error loading challenge details:', error);
    }
    setLoadingDetail(false);
  };

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
    loadDetails();
  };

  const handleReject = async (challengeId, userAddress) => {
    await onRejectRequest(challengeId, userAddress);
    loadDetails();
  };

  const parseProofData = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return { text: raw };
    }
  };

  const phaseLabel = PHASE_LABELS[challenge.phase] || 'Unknown';
  const phaseColor = PHASE_COLORS[challenge.phase] || '#607d8b';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content detail-modal">
        <div className="detail-header">
          <h3>{challenge.goal}</h3>
          <div className="detail-badges">
            {challenge.isPrivate && <span className="private-badge">Private</span>}
            <span className="phase-badge" style={{ backgroundColor: phaseColor }}>{phaseLabel}</span>
          </div>
        </div>

        <div className="detail-info">
          <div className="detail-row">
            <span>Stake</span>
            <strong>{formatUSDC(challenge.stakeAmount)} USDC</strong>
          </div>
          <div className="detail-row">
            <span>Total Pot</span>
            <strong>{formatUSDC(challenge.totalStaked)} USDC</strong>
          </div>
          <div className="detail-row">
            <span>Participants</span>
            <strong>{challenge.participantCount}</strong>
          </div>
          <div className="detail-row">
            <span>Creator</span>
            <strong>{challenge.creator.slice(0, 6)}...{challenge.creator.slice(-4)}</strong>
          </div>
        </div>

        {/* Show invite code to creator */}
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

        {/* Join with invite code section */}
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

        {/* Join requests section for creator */}
        {isCreator && challenge.isPrivate && (
          <JoinRequestsSection
            challenge={challenge}
            joinRequests={joinRequests}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {/* Participants and proofs */}
        <div className="detail-participants">
          <h4>Participants ({participants.length})</h4>
          {loadingDetail ? (
            <p className="loading-text">Loading...</p>
          ) : (
            participantDetails.map((p) => (
              <div key={p.address} className="participant-item">
                <div className="participant-header">
                  <span className="participant-address">
                    {p.address.slice(0, 6)}...{p.address.slice(-4)}
                    {p.address.toLowerCase() === challenge.creator.toLowerCase() && (
                      <span className="creator-label"> (Creator)</span>
                    )}
                  </span>
                  {p.hasSubmitted && (
                    <span className="vote-tally">
                      {p.votesFor} for / {p.votesAgainst} against
                    </span>
                  )}
                </div>

                {p.hasSubmitted && canSeeProofs && (
                  <div className="proof-content">
                    {(() => {
                      const parsed = parseProofData(p.proofData);
                      return (
                        <>
                          {parsed.text && <p>{parsed.text}</p>}
                          {parsed.media && parsed.mediaType === 'image' && (
                            <div className="proof-screenshot">
                              <img src={parsed.media} alt="Proof" />
                            </div>
                          )}
                          {parsed.media && parsed.mediaType === 'video' && (
                            <div className="proof-screenshot">
                              <video src={parsed.media} controls playsInline style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10 }} />
                            </div>
                          )}
                          {parsed.fitness && parsed.fitness.length > 0 && (
                            <div className="proof-terra">
                              {parsed.fitness.map((a, i) => (
                                <span key={i}>
                                  {a.name || a.type}: {a.duration ? `${Math.round(a.duration / 60000)}min` : ''} {a.distance ? `${(a.distance / 1000).toFixed(1)}km` : ''} {a.calories ? `${Math.round(a.calories)}cal` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {p.hasSubmitted && !canSeeProofs && (
                  <p className="proof-hidden">Proof hidden (private challenge - participants only)</p>
                )}

                {!p.hasSubmitted && (
                  <p className="no-proof">No proof submitted</p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="modal-buttons">
          <button onClick={onClose} className="cancel-btn" style={{ flex: 1 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChallengeDetailModal;

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function VotingModal({ challenge, contract, address, onCastVotes, onClose, onVoted }) {
  const [participants, setParticipants] = useState([]);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadParticipantProofs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadParticipantProofs = async () => {
    if (!contract) return;

    try {
      const addrs = await contract.getParticipants(challenge.id);
      const participantData = [];

      for (const addr of addrs) {
        // Skip self
        if (addr.toLowerCase() === address.toLowerCase()) continue;

        const hasSubmitted = await contract.hasSubmittedProof(challenge.id, addr);
        if (!hasSubmitted) continue;

        const proofData = await contract.getUserProof(challenge.id, addr);
        const [hasVoted] = await contract.getVoteStatus(challenge.id, address, addr);
        const [votesFor, votesAgainst] = await contract.getVoteCounts(challenge.id, addr);

        let parsedProof = {};
        try {
          parsedProof = JSON.parse(proofData);
        } catch {
          parsedProof = { text: proofData };
        }

        participantData.push({
          address: addr,
          displayAddress: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
          proof: parsedProof,
          alreadyVoted: hasVoted,
          votesFor: Number(votesFor),
          votesAgainst: Number(votesAgainst),
        });
      }

      setParticipants(participantData);
    } catch (error) {
      console.error('Error loading proofs:', error);
      toast.error('Failed to load participant proofs');
    }
    setLoading(false);
  };

  const handleVote = (participantAddress, approved) => {
    setVotes((prev) => ({ ...prev, [participantAddress]: approved }));
  };

  const handleSubmitVotes = async () => {
    const votableParticipants = participants.filter((p) => !p.alreadyVoted);
    const unvoted = votableParticipants.filter((p) => votes[p.address] === undefined);

    if (unvoted.length > 0) {
      toast.error('Please vote on all participants before submitting');
      return;
    }

    try {
      setSubmitting(true);
      toast.loading('Submitting votes...', { id: 'vote' });

      const addrs = votableParticipants.map((p) => p.address);
      const approvals = votableParticipants.map((p) => votes[p.address]);

      await onCastVotes(challenge.id, addrs, approvals);

      toast.success('Votes submitted!', { id: 'vote' });
      onVoted();
    } catch (error) {
      console.error('Error submitting votes:', error);
      toast.error('Failed: ' + (error.reason || error.message), { id: 'vote' });
    }
    setSubmitting(false);
  };

  const votableCount = participants.filter((p) => !p.alreadyVoted).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content voting-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Vote on Proofs</h3>
        <p className="modal-subtitle">Challenge: {challenge.goal}</p>

        {loading ? (
          <p>Loading proofs...</p>
        ) : participants.length === 0 ? (
          <p>No other participants have submitted proof yet.</p>
        ) : (
          <div className="voting-list">
            {participants.map((p) => (
              <div key={p.address} className="voting-item">
                <div className="voting-header">
                  <span className="participant-address">{p.displayAddress}</span>
                  <span className="vote-tally">
                    {p.votesFor} approve / {p.votesAgainst} reject
                  </span>
                </div>

                {/* Proof content */}
                <div className="proof-content">
                  {p.proof.text && <p>{p.proof.text}</p>}
                  {p.proof.media && (
                    <div className="proof-screenshot">
                      {p.proof.mediaType === 'video' ? (
                        <video src={p.proof.media} controls playsInline style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 10 }} />
                      ) : (
                        <img src={p.proof.media} alt="Proof" />
                      )}
                    </div>
                  )}
                  {/* Legacy: support old screenshot field */}
                  {!p.proof.media && p.proof.screenshot && (
                    <div className="proof-screenshot">
                      <img src={p.proof.screenshot} alt="Proof" />
                    </div>
                  )}
                  {p.proof.fitness && p.proof.fitness.length > 0 && (
                    <div className="proof-terra">
                      <strong>Fitness data:</strong>
                      {p.proof.fitness.map((a, i) => (
                        <span key={i}>
                          {a.name || a.type || 'Workout'} —{' '}
                          {a.duration ? `${Math.round(a.duration / 60)} min` : ''}{' '}
                          {a.distance ? `${(a.distance / 1000).toFixed(2)} km` : ''}
                          {a.calories ? ` — ${a.calories} cal` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vote buttons */}
                {p.alreadyVoted ? (
                  <span className="already-voted">Already voted</span>
                ) : (
                  <div className="vote-buttons">
                    <button
                      onClick={() => handleVote(p.address, true)}
                      className={`vote-approve ${votes[p.address] === true ? 'selected' : ''}`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVote(p.address, false)}
                      className={`vote-reject ${votes[p.address] === false ? 'selected' : ''}`}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-buttons">
          {votableCount > 0 && (
            <button
              onClick={handleSubmitVotes}
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Votes'}
            </button>
          )}
          <button onClick={onClose} className="cancel-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default VotingModal;

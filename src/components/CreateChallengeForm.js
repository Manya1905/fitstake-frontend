import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { keccak256, encodePacked } from 'viem';
import { parseUSDC, ZERO_BYTES32 } from '../utils/constants';

function CreateChallengeForm({ onCreateChallenge, onCreated, onCancel }) {
  const [goal, setGoal] = useState('');
  const [joinDeadline, setJoinDeadline] = useState('');
  const [deadline, setDeadline] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [proofWindowHours, setProofWindowHours] = useState('24');
  const [voteWindowHours, setVoteWindowHours] = useState('24');
  const [graceHours, setGraceHours] = useState('12');
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onCreateChallenge) return;

    const stakeInUSDC = parseUSDC(stakeAmount);
    const joinDeadlineTs = Math.floor(new Date(joinDeadline).getTime() / 1000);
    const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);

    if (joinDeadlineTs <= Math.floor(Date.now() / 1000)) {
      toast.error('Join deadline must be in the future');
      return;
    }
    if (deadlineTs <= joinDeadlineTs) {
      toast.error('Activity deadline must be after join deadline');
      return;
    }

    let inviteCodeHash = ZERO_BYTES32;
    if (isPrivate && inviteCode.trim()) {
      inviteCodeHash = keccak256(encodePacked(['string'], [inviteCode.trim()]));
    }

    try {
      setLoading(true);
      toast.loading('Creating challenge...', { id: 'create' });

      await onCreateChallenge(
        stakeInUSDC,
        goal,
        joinDeadlineTs,
        deadlineTs,
        parseInt(proofWindowHours),
        parseInt(voteWindowHours),
        parseInt(graceHours),
        isPrivate,
        inviteCodeHash
      );

      toast.success('Challenge created!', { id: 'create' });
      onCreated(isPrivate && inviteCode.trim() ? inviteCode.trim() : null);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed: ' + (error.reason || error.message), { id: 'create' });
    }
    setLoading(false);
  };

  return (
    <div className="create-form-screen">
      {/* Nav bar */}
      <div className="nav">
        <button className="btn-back" onClick={onCancel}>&larr; Back</button>
        <span className="nav-title">New challenge</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="create-form-body">
        <h2 className="create-form-heading">Create New Challenge</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Fitness Goal</label>
            <input
              className="form-input"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Run 5K in under 30 minutes"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Join Deadline</label>
            <input
              className="form-input"
              type="datetime-local"
              value={joinDeadline}
              onChange={(e) => setJoinDeadline(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Activity Deadline</label>
            <input
              className="form-input"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Stake Amount (USDC)
              <span className="tooltip-badge" title="Amount each participant must stake to join. Lost if you fail the challenge.">?</span>
            </label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0.01"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="10.00"
              required
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">
                Proof (hrs)
                <span className="tooltip-badge" title="Hours after activity deadline to submit proof of completion.">?</span>
              </label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={proofWindowHours}
                onChange={(e) => setProofWindowHours(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Vote (hrs)
                <span className="tooltip-badge" title="Hours after proof deadline for participants to vote on each other's proofs.">?</span>
              </label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={voteWindowHours}
                onChange={(e) => setVoteWindowHours(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Grace (hrs)
                <span className="tooltip-badge" title="Extra hours after voting for late voters. Set to 0 to skip.">?</span>
              </label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={graceHours}
                onChange={(e) => setGraceHours(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ accentColor: 'var(--color-teal)' }}
              />
              <span>Make this a private challenge</span>
            </label>
          </div>

          {isPrivate && (
            <div className="form-group">
              <label className="form-label">Invite Code (optional)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="form-input"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC12345"
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <button type="button" onClick={generateCode} className="btn btn-neutral btn-sm" style={{ width: 'auto', flexShrink: 0 }}>
                  Generate
                </button>
              </div>
              <p className="form-hint">
                Share this code with friends so they can join directly. Without a code, you'll need to approve each request.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            <button type="submit" disabled={loading} className="btn btn-teal" style={{ width: '100%' }}>
              {loading ? 'Creating Challenge...' : 'Create Challenge'}
            </button>
            <button type="button" onClick={onCancel} className="btn btn-ghost-pink" style={{ width: '100%' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChallengeForm;

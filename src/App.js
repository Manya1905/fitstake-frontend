import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import toast from 'react-hot-toast';
import { useContract } from './hooks/useContract';
import { useSmartContract } from './hooks/useSmartContract';
import { useFitness } from './hooks/useFitness';
import Header from './components/Header';
import ChallengeList from './components/ChallengeList';
import CreateChallengeForm from './components/CreateChallengeForm';
import ProofSubmissionModal from './components/ProofSubmissionModal';
import ProofViewerPanel from './components/ProofViewerPanel';
import FundWallet from './components/FundWallet';
import './App.css';

function App() {
  const { authenticated } = usePrivy();
  const { contract, usdcContract, address } = useContract();
  const {
    approveAndCreateChallenge,
    approveAndJoinChallenge,
    distributeRewards: smartDistributeRewards,
    submitProof: smartSubmitProof,
    castVotes: smartCastVotes,
    requestToJoin: smartRequestToJoin,
    approveJoinRequest: smartApproveJoinRequest,
    rejectJoinRequest: smartRejectJoinRequest,
    approveAndJoinWithInviteCode: smartJoinWithInviteCode,
  } = useSmartContract();
  const fitnessHook = useFitness();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [proofChallenge, setProofChallenge] = useState(null);
  const [viewChallenge, setViewChallenge] = useState(null);
  const [showFundWallet, setShowFundWallet] = useState(false);
  const loadChallenges = useCallback(async () => {
    if (!contract || !address) return;

    setLoading(true);
    try {
      const count = await contract.challengeCount();
      const challengeList = [];

      for (let i = 1; i <= Number(count); i++) {
        const c = await contract.getChallenge(i);
        const phase = await contract.getChallengePhase(i);
        const hasJoined = await contract.hasJoinedChallenge(i, address);
        const hasSubmitted = await contract.hasSubmittedProof(i, address);
        const hasVoted = await contract.hasVotedAtAll(i, address);

        // Load privacy info
        const [isPrivate, hasInviteCode] = await contract.getChallengePrivacy(i);

        // Load join request status for private challenges
        let hasRequested = false;
        let isApproved = false;
        if (isPrivate) {
          hasRequested = await contract.hasRequestedToJoin(i, address);
          isApproved = await contract.isApprovedToJoin(i, address);
        }

        challengeList.push({
          id: Number(c.id),
          creator: c.creator,
          goal: c.goal,
          joinDeadline: Number(c.joinDeadline),
          deadline: Number(c.deadline),
          proofDeadline: Number(c.proofDeadline),
          voteDeadline: Number(c.voteDeadline),
          graceDeadline: Number(c.graceDeadline),
          stakeAmount: c.stakeAmount,
          participantCount: Number(c.participantCount),
          totalStaked: c.totalStaked,
          isDistributed: c.isDistributed,
          phase: Number(phase),
          hasJoined,
          hasSubmitted,
          hasVoted,
          isPrivate,
          hasInviteCode,
          hasRequested,
          isApproved,
        });
      }

      // Sort: active first, then by newest
      challengeList.sort((a, b) => {
        if (a.isDistributed === b.isDistributed) return b.id - a.id;
        return a.isDistributed ? 1 : -1;
      });

      setChallenges(challengeList);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast.error('Error loading challenges');
    }
    setLoading(false);
  }, [contract, address]);

  useEffect(() => {
    if (contract && address) {
      loadChallenges();
    }
  }, [contract, address, loadChallenges]);

  const handleJoin = async (challengeId, stakeAmount) => {
    try {
      setLoading(true);
      toast.loading('Joining challenge...', { id: 'join' });

      await approveAndJoinChallenge(challengeId, stakeAmount);

      toast.success('Joined challenge!', { id: 'join' });
      await loadChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed: ' + (error.reason || error.message), { id: 'join' });
    }
    setLoading(false);
  };

  const handleDistribute = async (challengeId) => {
    try {
      setLoading(true);
      toast.loading('Distributing rewards...', { id: 'distribute' });

      await smartDistributeRewards(challengeId);

      toast.success('Rewards distributed!', { id: 'distribute' });
      await loadChallenges();
    } catch (error) {
      console.error('Error distributing rewards:', error);
      toast.error('Failed: ' + (error.reason || error.message), { id: 'distribute' });
    }
    setLoading(false);
  };

  const handleRequestToJoin = async (challengeId) => {
    try {
      setLoading(true);
      toast.loading('Requesting to join...', { id: 'request' });

      await smartRequestToJoin(challengeId);

      toast.success('Request sent! Waiting for creator approval.', { id: 'request' });
      await loadChallenges();
    } catch (error) {
      console.error('Error requesting to join:', error);
      toast.error('Failed: ' + (error.reason || error.message), { id: 'request' });
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <Header
        usdcContract={usdcContract}
        address={address}
        fitnessHook={fitnessHook}
      />

      {authenticated && address && (
        <main className="main-content">
          <div className="actions-bar">
            <h2>Challenges</h2>
            <div className="actions-buttons">
              <button
                onClick={() => setShowFundWallet(!showFundWallet)}
                className="fund-toggle-btn"
              >
                Get USDC
              </button>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="create-btn"
              >
                {showCreateForm ? 'Cancel' : '+ Create Challenge'}
              </button>
            </div>
          </div>

          {showFundWallet && <FundWallet address={address} />}

          {showCreateForm && (
            <CreateChallengeForm
              onCreateChallenge={approveAndCreateChallenge}
              onCreated={async (inviteCode) => {
                setShowCreateForm(false);
                if (inviteCode && contract) {
                  try {
                    const count = await contract.challengeCount();
                    localStorage.setItem(`fitstake_invite_${Number(count)}`, inviteCode);
                  } catch (err) {
                    console.error('Failed to store invite code:', err);
                  }
                }
                loadChallenges();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          <ChallengeList
            challenges={challenges}
            loading={loading}
            onJoin={handleJoin}
            onSubmitProof={(challenge) => setProofChallenge(challenge)}
            onVote={(challenge) => setViewChallenge(challenge)}
            onDistribute={handleDistribute}
            onViewDetail={(challenge) => setViewChallenge(challenge)}
            onRequestToJoin={handleRequestToJoin}
          />

          {proofChallenge && (
            <ProofSubmissionModal
              challenge={proofChallenge}
              onSubmitProof={smartSubmitProof}
              fitnessHook={fitnessHook}
              onClose={() => setProofChallenge(null)}
              onSubmitted={() => {
                setProofChallenge(null);
                loadChallenges();
              }}
            />
          )}

          {viewChallenge && (
            <ProofViewerPanel
              challenge={viewChallenge}
              contract={contract}
              address={address}
              onCastVotes={smartCastVotes}
              onClose={() => setViewChallenge(null)}
              onVoted={() => {
                setViewChallenge(null);
                loadChallenges();
              }}
              onApproveRequest={smartApproveJoinRequest}
              onRejectRequest={smartRejectJoinRequest}
              onJoinWithCode={smartJoinWithInviteCode}
              onRefresh={loadChallenges}
            />
          )}
        </main>
      )}
    </div>
  );
}

export default App;

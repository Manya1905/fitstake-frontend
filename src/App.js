import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import toast from 'react-hot-toast';
import { BACKEND_URL, Phase } from './utils/constants';
import { useContract } from './hooks/useContract';
import { useSmartContract } from './hooks/useSmartContract';
import { useFitness } from './hooks/useFitness';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import LandingPage from './components/LandingPage';
import OnboardingSlides from './components/OnboardingSlides';
import ChallengeList from './components/ChallengeList';
import CreateChallengeForm from './components/CreateChallengeForm';
import ProofSubmissionModal from './components/ProofSubmissionModal';
import ProofViewerPanel from './components/ProofViewerPanel';
import ProfileTab from './components/ProfileTab';
import DashboardHistory from './components/DashboardHistory';
import TransactionOverlay from './components/TransactionOverlay';
import './App.css';

function App() {
  const { login, authenticated, user } = usePrivy();
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

  // Tab navigation
  const [activeTab, setActiveTab] = useState('active');

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Challenge data
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Views
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [proofChallenge, setProofChallenge] = useState(null);
  const [viewChallenge, setViewChallenge] = useState(null);

  // Transaction overlay
  const [txMessage, setTxMessage] = useState('');
  const [txVisible, setTxVisible] = useState(false);

  // Onboarding trigger
  useEffect(() => {
    if (authenticated && !localStorage.getItem('fitstake_onboarded')) {
      setShowOnboarding(true);
    }
  }, [authenticated]);

  const loadChallenges = useCallback(async (silent = false) => {
    if (!contract || !address) return;

    if (!silent) setLoading(true);
    try {
      const count = await contract.challengeCount();
      const challengeList = [];

      for (let i = 1; i <= Number(count); i++) {
        const c = await contract.getChallenge(i);
        const phase = await contract.getChallengePhase(i);
        const hasJoined = await contract.hasJoinedChallenge(i, address);
        const hasSubmitted = await contract.hasSubmittedProof(i, address);
        const hasVoted = await contract.hasVotedAtAll(i, address);

        const [isPrivate, hasInviteCode] = await contract.getChallengePrivacy(i);

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

      challengeList.sort((a, b) => {
        if (a.isDistributed === b.isDistributed) return b.id - a.id;
        return a.isDistributed ? 1 : -1;
      });

      setChallenges(challengeList);
    } catch (error) {
      console.error('Error loading challenges:', error);
      if (!silent) toast.error('Error loading challenges');
    }
    if (!silent) setLoading(false);
  }, [contract, address]);

  useEffect(() => {
    if (contract && address) {
      loadChallenges();
    }
  }, [contract, address, loadChallenges]);

  useEffect(() => {
    if (!contract || !address) return;
    const interval = setInterval(() => loadChallenges(true), 30000);
    return () => clearInterval(interval);
  }, [contract, address, loadChallenges]);

  // Register email → wallet mapping on login
  useEffect(() => {
    const email = user?.email?.address;
    if (authenticated && address && email) {
      fetch(`${BACKEND_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, email }),
      }).catch((err) => console.error('Failed to register user:', err));
    }
  }, [authenticated, address, user]);

  // Challenge filtering for tabs
  const activeChallenges = challenges.filter((c) => c.hasJoined && !c.isDistributed);
  const exploreChallenges = challenges.filter((c) => !c.hasJoined && !c.isDistributed);

  // Handlers with transaction overlay
  const handleJoin = async (challengeId, stakeAmount) => {
    try {
      setTxMessage('Joining challenge...');
      setTxVisible(true);
      await approveAndJoinChallenge(challengeId, stakeAmount);
      toast.success('Joined challenge!');
      await loadChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed: ' + (error.reason || error.message));
    }
    setTxVisible(false);
  };

  const handleDistribute = async (challengeId) => {
    try {
      setTxMessage('Distributing rewards...');
      setTxVisible(true);
      await smartDistributeRewards(challengeId);
      toast.success('Rewards distributed!');
      await loadChallenges();
    } catch (error) {
      console.error('Error distributing rewards:', error);
      toast.error('Failed: ' + (error.reason || error.message));
    }
    setTxVisible(false);
  };

  const handleRequestToJoin = async (challengeId) => {
    try {
      setTxMessage('Requesting to join...');
      setTxVisible(true);
      await smartRequestToJoin(challengeId);
      toast.success('Request sent! Waiting for creator approval.');
      await loadChallenges();
    } catch (error) {
      console.error('Error requesting to join:', error);
      toast.error('Failed: ' + (error.reason || error.message));
    }
    setTxVisible(false);
  };

  // Unauthenticated: Landing page
  if (!authenticated) {
    return (
      <div className="App">
        <LandingPage onSignIn={login} />
      </div>
    );
  }

  // First login: Onboarding
  if (showOnboarding) {
    return (
      <div className="App">
        <OnboardingSlides
          address={address}
          fitnessHook={fitnessHook}
          onComplete={() => setShowOnboarding(false)}
        />
      </div>
    );
  }

  // Create challenge: full-screen
  if (showCreateForm) {
    return (
      <div className="App">
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
        <TransactionOverlay message={txMessage} visible={txVisible} />
      </div>
    );
  }

  // Proof submission: full-screen overlay
  if (proofChallenge) {
    return (
      <div className="App">
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
        <TransactionOverlay message={txMessage} visible={txVisible} />
      </div>
    );
  }

  // Proof viewer: full-screen overlay
  if (viewChallenge) {
    return (
      <div className="App">
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
        <TransactionOverlay message={txMessage} visible={txVisible} />
      </div>
    );
  }

  return (
    <div className="App">
      <Header
        usdcContract={usdcContract}
        address={address}
        onOpenProfile={() => setActiveTab('profile')}
      />

      <main className="main-content">
        {activeTab === 'active' && (
          <>
            <div className="dashboard-actions">
              <button className="btn btn-neutral btn-sm" onClick={() => setActiveTab('profile')}>
                Buy USDC
              </button>
              <button className="btn btn-pink btn-sm" onClick={() => setShowCreateForm(true)}>
                + Create challenge
              </button>
            </div>
            <ChallengeList
              challenges={activeChallenges}
              loading={loading}
              onJoin={handleJoin}
              onSubmitProof={(challenge) => setProofChallenge(challenge)}
              onVote={(challenge) => setViewChallenge(challenge)}
              onDistribute={handleDistribute}
              onViewDetail={(challenge) => setViewChallenge(challenge)}
              onRequestToJoin={handleRequestToJoin}
              emptyTitle="No active challenges"
              emptyBody="Join or create a challenge to get started!"
              emptyCta="+ Create a challenge"
              onEmptyCta={() => setShowCreateForm(true)}
            />
          </>
        )}

        {activeTab === 'explore' && (
          <ChallengeList
            challenges={exploreChallenges}
            loading={loading}
            onJoin={handleJoin}
            onSubmitProof={(challenge) => setProofChallenge(challenge)}
            onVote={(challenge) => setViewChallenge(challenge)}
            onDistribute={handleDistribute}
            onViewDetail={(challenge) => setViewChallenge(challenge)}
            onRequestToJoin={handleRequestToJoin}
            emptyTitle="No open challenges yet"
            emptyBody="Be the first! Create a challenge and invite friends to join, or check back soon."
            emptyCta="+ Create a challenge"
            onEmptyCta={() => setShowCreateForm(true)}
          />
        )}

        {activeTab === 'history' && (
          <DashboardHistory contract={contract} address={address} />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            usdcContract={usdcContract}
            address={address}
            fitnessHook={fitnessHook}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <TransactionOverlay message={txMessage} visible={txVisible} />
    </div>
  );
}

export default App;

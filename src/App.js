import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import FitStakeABI from './FitStake.json';
import './App.css';

const CONTRACT_ADDRESS = '0x920082097e3e0b6f449fdc2225c4a8e3492b6f7c';

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProofModal, setShowProofModal] = useState(null);
  const [error, setError] = useState('');
  
  // Form state
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [proofText, setProofText] = useState('');
  const [succeeded, setSucceeded] = useState(true);

  const connectWallet = async () => {
  if (window.ethereum) {
    try {
      // Request accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setAccount(accounts[0]);
      
      // Check network FIRST
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current chain:', chainId);
      
      // Force switch to Sepolia if not on it
      const sepoliaChainId = '0xaa36a7'; // 11155111 in hex
      if (chainId !== sepoliaChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
          });
        } catch (switchError) {
          alert('Please switch to Sepolia network in MetaMask');
          return;
        }
      }
      
      // Create provider AFTER network confirmed
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();
      console.log('Connected to network:', network.chainId);
      
      // Create contract
      const signer = web3Provider.getSigner();
      const fitStakeContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FitStakeABI.abi,
        signer
      );
      
      setContract(fitStakeContract);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Connection failed: ' + error.message);
      alert('Failed to connect: ' + error.message);
    }
  } else {
    alert('Please install MetaMask!');
  }
  };

const disconnectWallet = () => {
  setAccount('');
  setContract(null);
  setChallenges([]);
  setError('');
};

  const loadChallenges = useCallback(async () => {
    if (!contract) return;
    
    setLoading(true);
    setError('');
    try {
      const count = await contract.challengeCount();
      const challengeList = [];
      
      for (let i = 1; i <= count.toNumber(); i++) {
        const challenge = await contract.getChallenge(i);
        const hasJoined = await contract.hasJoinedChallenge(i, account);
        
        challengeList.push({
          id: challenge.id.toNumber(),
          creator: challenge.creator,
          goal: challenge.goal,
          deadline: new Date(challenge.deadline.toNumber() * 1000),
          deadlineTimestamp: challenge.deadline.toNumber(),
          stakeAmount: ethers.utils.formatEther(challenge.stakeAmount),
          participantCount: challenge.participantCount.toNumber(),
          totalStaked: ethers.utils.formatEther(challenge.totalStaked),
          isDistributed: challenge.isDistributed,
          hasJoined: hasJoined
        });
      }
      
      // Sort: Active challenges first (by deadline descending), then completed
      challengeList.sort((a, b) => {
        // Both active or both completed - sort by newest first
        if (a.isDistributed === b.isDistributed) {
          return b.id - a.id; // Newest first
        }
        // Active challenges come before completed
        return a.isDistributed ? 1 : -1;
      });

      setChallenges(challengeList);
    } catch (error) {
      console.error('Error loading challenges:', error);
      setError('Error loading: ' + error.message);
    }
    setLoading(false);
  }, [contract, account]);

  const createChallenge = async (e) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
      const stakeInWei = ethers.utils.parseEther(stakeAmount);
      
      const tx = await contract.createChallenge(goal, deadlineTimestamp, stakeInWei, {
        value: stakeInWei
      });
      
      alert('Challenge creation submitted! Waiting for confirmation...');
      await tx.wait();
      alert('Challenge created successfully!');
      
      setGoal('');
      setDeadline('');
      setStakeAmount('');
      setShowCreateForm(false);
      await loadChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge: ' + error.message);
    }
    setLoading(false);
  };

  const joinChallenge = async (challengeId, stakeAmount) => {
    if (!contract) return;

    try {
      setLoading(true);
      const stakeInWei = ethers.utils.parseEther(stakeAmount);
      
      const tx = await contract.joinChallenge(challengeId, {
        value: stakeInWei
      });
      
      alert('Joining challenge... Waiting for confirmation...');
      await tx.wait();
      alert('Successfully joined challenge!');
      await loadChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert('Failed to join challenge: ' + error.message);
    }
    setLoading(false);
  };

  const submitProof = async (challengeId) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.submitProof(challengeId, succeeded, proofText);
      
      alert('Submitting proof... Waiting for confirmation...');
      await tx.wait();
      alert('Proof submitted successfully!');
      
      setProofText('');
      setShowProofModal(null);
      await loadChallenges();
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit proof: ' + error.message);
    }
    setLoading(false);
  };

  const distributeRewards = async (challengeId) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.distributeRewards(challengeId);
      
      alert('Distributing rewards... Waiting for confirmation...');
      await tx.wait();
      alert('Rewards distributed successfully!');
      await loadChallenges();
    } catch (error) {
      console.error('Error distributing rewards:', error);
      alert('Failed to distribute rewards: ' + error.message);
    }
    setLoading(false);
  };

  const isDeadlinePassed = (deadlineTimestamp) => {
    return Math.floor(Date.now() / 1000) > deadlineTimestamp;
  };

  useEffect(() => {
    if (contract && account) {
      loadChallenges();
    }
  }, [contract, account, loadChallenges]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>💪 FitStake</h1>
        <p>Bet on yourself. Win money for hitting your fitness goals.</p>
        
        {!account ? (
          <button onClick={connectWallet} className="connect-btn">
            Connect MetaMask
          </button>
        ) : (
          <div className="header-buttons">
            <div className="account-info">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
            <button onClick={disconnectWallet} className="connect-btn">
              Disconnect
            </button>
          </div>
        )}
      </header>

      {account && (
        <main className="main-content">
          <div className="actions-bar">
            <h2>Active Challenges</h2>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)} 
              className="create-btn"
            >
              {showCreateForm ? 'Cancel' : '+ Create Challenge'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={createChallenge} className="create-form">
              <h3>Create New Challenge</h3>
              
              <div className="form-group">
                <label>Fitness Goal</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Run 5K in under 30 minutes"
                  required
                />
              </div>

              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Stake Amount (ETH)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.001"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Creating...' : 'Create Challenge'}
              </button>
            </form>
          )}
          
          {loading && !showCreateForm ? (
            <p>Loading challenges...</p>
          ) : error ? (
            <p style={{color: 'red', background: 'white', padding: '1rem', borderRadius: '10px'}}>{error}</p>
          ) : challenges.length === 0 ? (
            <p>No challenges yet. Create one to get started!</p>
          ) : (
            <div className="challenges-grid">
              {challenges.map(challenge => {
                const deadlinePassed = isDeadlinePassed(challenge.deadlineTimestamp);
                
                return (
                  <div key={challenge.id} className="challenge-card">
                    <h3>{challenge.goal}</h3>
                    <p><strong>Stake:</strong> {challenge.stakeAmount} ETH</p>
                    <p><strong>Participants:</strong> {challenge.participantCount}</p>
                    <p><strong>Total Pot:</strong> {challenge.totalStaked} ETH</p>
                    <p><strong>Deadline:</strong> {challenge.deadline.toLocaleString()}</p>
                    <p><strong>Status:</strong> {challenge.isDistributed ? 'Completed ✅' : 'Active 🔥'}</p>
                    
                    {!challenge.isDistributed && !deadlinePassed && !challenge.hasJoined && (
                      <button 
                        onClick={() => joinChallenge(challenge.id, challenge.stakeAmount)}
                        disabled={loading}
                        className="join-btn"
                      >
                        Join Challenge
                      </button>
                    )}
                    
                    {!challenge.isDistributed && deadlinePassed && challenge.hasJoined && (
                      <button 
                        onClick={() => setShowProofModal(challenge.id)}
                        disabled={loading}
                        className="proof-btn"
                      >
                        Submit Proof
                      </button>
                    )}
                    
                    {!challenge.isDistributed && deadlinePassed && (
                      <button 
                        onClick={() => distributeRewards(challenge.id)}
                        disabled={loading}
                        className="distribute-btn"
                      >
                        Distribute Rewards
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showProofModal && (
            <div className="modal-overlay" onClick={() => setShowProofModal(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Submit Proof of Completion</h3>
                
                <div className="form-group">
                  <label>Did you complete the challenge?</label>
                  <select value={succeeded} onChange={(e) => setSucceeded(e.target.value === 'true')}>
                    <option value="true">Yes, I completed it! ✅</option>
                    <option value="false">No, I failed 😔</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Proof (URL or description)</label>
                  <textarea
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="e.g., Strava link, photo URL, or description..."
                    rows="4"
                    required
                  />
                </div>

                <div className="modal-buttons">
                  <button onClick={() => submitProof(showProofModal)} className="submit-btn" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Proof'}
                  </button>
                  <button onClick={() => setShowProofModal(null)} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
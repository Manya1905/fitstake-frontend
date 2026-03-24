import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { usePrivy } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import { CONTRACT_ADDRESS, USDC_ADDRESS, FITSTAKE_ABI, USDC_ABI_VIEM } from '../utils/constants';

export function useSmartContract() {
  const { client } = useSmartWallets();
  const { user } = usePrivy();

  // Get the smart wallet address from linked accounts
  const smartWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'smart_wallet'
  );
  const smartWalletAddress = smartWallet?.address || '';

  // Wait for smart wallet client to be ready (up to 10 seconds)
  const getClient = async () => {
    if (client) return client;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (client) return client;
    }
    throw new Error('Smart wallet not ready. Please wait a moment and try again.');
  };

  // Batch: approve USDC + create challenge in one atomic tx
  const approveAndCreateChallenge = async (stakeAmount, goal, joinDeadlineTs, deadlineTs, proofWindowHours, voteWindowHours, graceHours, isPrivate = false, inviteCodeHash = '0x0000000000000000000000000000000000000000000000000000000000000000') => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      calls: [
        {
          to: USDC_ADDRESS,
          data: encodeFunctionData({
            abi: USDC_ABI_VIEM,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, stakeAmount],
          }),
        },
        {
          to: CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: FITSTAKE_ABI,
            functionName: 'createChallenge',
            // eslint-disable-next-line no-undef
            args: [goal, BigInt(joinDeadlineTs), BigInt(deadlineTs), stakeAmount, BigInt(proofWindowHours), BigInt(voteWindowHours), BigInt(graceHours), isPrivate, inviteCodeHash],
          }),
        },
      ],
    });
    return txHash;
  };

  // Batch: approve USDC + join challenge in one atomic tx
  const approveAndJoinChallenge = async (challengeId, stakeAmount) => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      calls: [
        {
          to: USDC_ADDRESS,
          data: encodeFunctionData({
            abi: USDC_ABI_VIEM,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, stakeAmount],
          }),
        },
        {
          to: CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: FITSTAKE_ABI,
            functionName: 'joinChallenge',
            // eslint-disable-next-line no-undef
            args: [BigInt(challengeId)],
          }),
        },
      ],
    });
    return txHash;
  };

  // Single tx: submit proof
  const submitProof = async (challengeId, proofData) => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: FITSTAKE_ABI,
        functionName: 'submitProof',
        // eslint-disable-next-line no-undef
        args: [BigInt(challengeId), proofData],
      }),
    });
    return txHash;
  };

  // Single tx: cast votes
  const castVotes = async (challengeId, addresses, approvals) => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: FITSTAKE_ABI,
        functionName: 'castVotes',
        // eslint-disable-next-line no-undef
        args: [BigInt(challengeId), addresses, approvals],
      }),
    });
    return txHash;
  };

  // Single tx: distribute rewards
  const distributeRewards = async (challengeId) => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: FITSTAKE_ABI,
        functionName: 'distributeRewards',
        // eslint-disable-next-line no-undef
        args: [BigInt(challengeId)],
      }),
    });
    return txHash;
  };

  // Single tx: request to join private challenge
  const requestToJoin = async (challengeId) => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: FITSTAKE_ABI,
        functionName: 'requestToJoin',
        // eslint-disable-next-line no-undef
        args: [BigInt(challengeId)],
      }),
    });
    return txHash;
  };

  // Single tx: approve join request (creator only)
  const approveJoinRequest = async (challengeId, userAddress) => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: FITSTAKE_ABI,
        functionName: 'approveJoinRequest',
        // eslint-disable-next-line no-undef
        args: [BigInt(challengeId), userAddress],
      }),
    });
    return txHash;
  };

  // Single tx: reject join request (creator only)
  const rejectJoinRequest = async (challengeId, userAddress) => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: FITSTAKE_ABI,
        functionName: 'rejectJoinRequest',
        // eslint-disable-next-line no-undef
        args: [BigInt(challengeId), userAddress],
      }),
    });
    return txHash;
  };

  // Batch: approve USDC + join with invite code in one atomic tx
  const approveAndJoinWithInviteCode = async (challengeId, inviteCode, stakeAmount) => {
    const c = await getClient();

    const txHash = await c.sendTransaction({
      calls: [
        {
          to: USDC_ADDRESS,
          data: encodeFunctionData({
            abi: USDC_ABI_VIEM,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, stakeAmount],
          }),
        },
        {
          to: CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: FITSTAKE_ABI,
            functionName: 'joinWithInviteCode',
            // eslint-disable-next-line no-undef
            args: [BigInt(challengeId), inviteCode],
          }),
        },
      ],
    });
    return txHash;
  };

  return {
    client,
    smartWalletAddress,
    approveAndCreateChallenge,
    approveAndJoinChallenge,
    submitProof,
    castVotes,
    distributeRewards,
    requestToJoin,
    approveJoinRequest,
    rejectJoinRequest,
    approveAndJoinWithInviteCode,
  };
}

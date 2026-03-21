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

  // Batch: approve USDC + create challenge in one atomic tx
  const approveAndCreateChallenge = async (stakeAmount, goal, joinDeadlineTs, deadlineTs, proofWindowHours, voteWindowHours, graceHours) => {
    if (!client) throw new Error('Smart wallet not ready');

    const txHash = await client.sendTransaction({
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
            args: [goal, BigInt(joinDeadlineTs), BigInt(deadlineTs), stakeAmount, BigInt(proofWindowHours), BigInt(voteWindowHours), BigInt(graceHours)],
          }),
        },
      ],
    });
    return txHash;
  };

  // Batch: approve USDC + join challenge in one atomic tx
  const approveAndJoinChallenge = async (challengeId, stakeAmount) => {
    if (!client) throw new Error('Smart wallet not ready');

    const txHash = await client.sendTransaction({
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
    if (!client) throw new Error('Smart wallet not ready');

    const txHash = await client.sendTransaction({
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
    if (!client) throw new Error('Smart wallet not ready');

    const txHash = await client.sendTransaction({
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
    if (!client) throw new Error('Smart wallet not ready');

    const txHash = await client.sendTransaction({
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

  return {
    client,
    smartWalletAddress,
    approveAndCreateChallenge,
    approveAndJoinChallenge,
    submitProof,
    castVotes,
    distributeRewards,
  };
}

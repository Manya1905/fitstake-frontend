import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { CONTRACT_ADDRESS, USDC_ADDRESS, FITSTAKE_ABI, USDC_ABI, BASE_SEPOLIA } from '../utils/constants';

// Public RPC provider for read-only contract calls (always Base Sepolia)
const PUBLIC_RPC = BASE_SEPOLIA.rpcUrls.default.http[0];

export function useContract() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [contract, setContract] = useState(null);
  const [usdcContract, setUsdcContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');

  // Prefer smart wallet address over EOA for on-chain identity
  const smartWalletAddress = useMemo(() => {
    const sw = user?.linkedAccounts?.find((a) => a.type === 'smart_wallet');
    return sw?.address || '';
  }, [user]);

  const connect = useCallback(async () => {
    console.log('useContract: checking...', { ready, authenticated, walletsCount: wallets?.length });

    if (!ready || !authenticated) return;
    if (!wallets || wallets.length === 0) return;

    try {
      // Prefer Privy embedded wallet over browser extension wallets
      const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
      console.log('useContract: wallet found', wallet.address, 'type:', wallet.walletClientType);

      // Switch to Base Sepolia
      try {
        await wallet.switchChain(84532);
        console.log('useContract: switched to Base Sepolia');
      } catch (switchErr) {
        console.warn('useContract: chain switch error', switchErr.message);
      }

      const walletAddress = wallet.address;

      // Use public RPC for read-only contract (guaranteed Base Sepolia)
      const readProvider = new ethers.providers.JsonRpcProvider(PUBLIC_RPC);
      console.log('useContract: using public RPC for reads:', PUBLIC_RPC);

      const fitStakeContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FITSTAKE_ABI,
        readProvider
      );

      const usdcContractInstance = new ethers.Contract(
        USDC_ADDRESS,
        USDC_ABI,
        readProvider
      );

      setProvider(readProvider);
      setSigner(null);
      setContract(fitStakeContract);
      setUsdcContract(usdcContractInstance);
      setAddress(walletAddress);
      console.log('useContract: SUCCESS - all set');
    } catch (error) {
      console.error('useContract: FAILED', error);
    }
  }, [ready, authenticated, wallets]);

  useEffect(() => {
    connect();
  }, [connect]);

  // Use smart wallet address if available, otherwise fall back to EOA
  const effectiveAddress = smartWalletAddress || address;

  return { contract, usdcContract, provider, signer, address: effectiveAddress, reconnect: connect };
}

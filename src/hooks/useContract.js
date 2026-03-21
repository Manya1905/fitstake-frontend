import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { CONTRACT_ADDRESS, USDC_ADDRESS, FITSTAKE_ABI, USDC_ABI } from '../utils/constants';

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
      const wallet = wallets[0];
      console.log('useContract: wallet found', wallet.address);
      console.log('useContract: wallet methods', Object.keys(wallet).join(', '));

      // Switch to Base Sepolia
      try {
        await wallet.switchChain(84532);
        console.log('useContract: switched to Base Sepolia');
      } catch (switchErr) {
        console.warn('useContract: chain switch error', switchErr.message);
      }

      // Privy v3: getEthereumProvider() returns raw EIP-1193 provider
      const eip1193Provider = await wallet.getEthereumProvider();
      console.log('useContract: got EIP-1193 provider');

      // Wrap with ethers v5 Web3Provider
      const web3Provider = new ethers.providers.Web3Provider(eip1193Provider);
      const web3Signer = web3Provider.getSigner();
      const walletAddress = wallet.address;

      console.log('useContract: creating contracts at', CONTRACT_ADDRESS, 'for wallet', walletAddress);

      const fitStakeContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FITSTAKE_ABI,
        web3Signer
      );

      const usdcContractInstance = new ethers.Contract(
        USDC_ADDRESS,
        USDC_ABI,
        web3Signer
      );

      setProvider(web3Provider);
      setSigner(web3Signer);
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

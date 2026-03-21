import React, { useState, useEffect, useCallback } from 'react';
import { formatUSDC } from '../utils/constants';

function USDCBalance({ usdcContract, address }) {
  const [balance, setBalance] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!usdcContract || !address) return;
    try {
      const bal = await usdcContract.balanceOf(address);
      setBalance(bal);
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
    }
  }, [usdcContract, address]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchBalance]);

  if (balance === null) return null;

  return (
    <div className="usdc-balance">
      {formatUSDC(balance)} USDC
    </div>
  );
}

export default USDCBalance;

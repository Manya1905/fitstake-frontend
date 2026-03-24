import React from 'react';
import { useFundWallet } from '@privy-io/react-auth';

function FundWallet({ address }) {
  const { fundWallet } = useFundWallet();

  if (!address) return null;

  const handleFund = () => {
    fundWallet({
      address,
      options: {
        chain: { id: 8453 },
        amount: '5',
        asset: 'USDC',
      },
    });
  };

  return (
    <div className="fund-wallet">
      <button onClick={handleFund} className="fund-btn">
        Buy USDC
      </button>
      <p className="fund-hint">
        Purchase USDC with your credit card. Funds go directly to your wallet.
      </p>
    </div>
  );
}

export default FundWallet;

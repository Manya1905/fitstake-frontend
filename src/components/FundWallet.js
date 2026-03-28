import React, { useState } from 'react';
import { useFundWallet } from '@privy-io/react-auth';

function FundWallet({ address }) {
  const { fundWallet } = useFundWallet();
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button onClick={handleFund} className="btn btn-pink" style={{ width: '100%', marginBottom: 10 }}>
        Buy USDC
      </button>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
        Or send USDC on Base to your wallet:
      </p>
      <div className="wallet-address-row">
        <code className="wallet-address-sm">{address.slice(0, 6)}...</code>
        <button className="btn btn-neutral btn-sm" onClick={handleCopy} style={{ width: 'auto', flexShrink: 0 }}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default FundWallet;

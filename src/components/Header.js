import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import USDCBalance from './USDCBalance';
import { getInitials } from '../utils/avatarColor';

function Header({ usdcContract, address, onOpenProfile }) {
  const { user } = usePrivy();

  const email = user?.email?.address;

  return (
    <div className="nav">
      <div className="wordmark">
        <span className="fit">Fit</span>
        <span className="stake">Stake</span>
      </div>
      <div className="nav-right">
        <USDCBalance usdcContract={usdcContract} address={address} />
        <div
          className="nav-avatar"
          onClick={onOpenProfile}
          title="View profile"
        >
          {getInitials(address || '0x0000', email)}
        </div>
      </div>
    </div>
  );
}

export default Header;

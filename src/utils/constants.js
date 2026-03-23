import { parseAbi } from 'viem';
import abi from './abi.json';

// Contract addresses (Base Sepolia)
export const CONTRACT_ADDRESS = '0x952B11d34907e2cF17896Cd349E1D9927FE67914';
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Backend URL
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://fitstake-backend.onrender.com';

// Cloudinary
export const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '';

// Contract ABI
export const FITSTAKE_ABI = abi;

// USDC ABI (minimal — just what we need)
export const USDC_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

// Base Sepolia chain config
export const BASE_SEPOLIA = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.REACT_APP_ALCHEMY_BASE_SEPOLIA_URL || 'https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

// Phase enum matching the contract
export const Phase = {
  Joining: 0,
  Active: 1,
  ProofSubmission: 2,
  Voting: 3,
  GracePeriod: 4,
  Completed: 5,
};

export const PHASE_LABELS = {
  [Phase.Joining]: 'Joining',
  [Phase.Active]: 'Active',
  [Phase.ProofSubmission]: 'Submit Proof',
  [Phase.Voting]: 'Voting',
  [Phase.GracePeriod]: 'Grace Period',
  [Phase.Completed]: 'Completed',
};

export const PHASE_COLORS = {
  [Phase.Joining]: '#4caf50',
  [Phase.Active]: '#2196f3',
  [Phase.ProofSubmission]: '#ff9800',
  [Phase.Voting]: '#9c27b0',
  [Phase.GracePeriod]: '#ff5722',
  [Phase.Completed]: '#607d8b',
};

// USDC ABI for viem (used by smart wallet write operations)
export const USDC_ABI_VIEM = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
]);

// USDC helpers (6 decimals)
export function parseUSDC(amount) {
  // eslint-disable-next-line no-undef
  return BigInt(Math.round(parseFloat(amount) * 1e6));
}

export function formatUSDC(amount) {
  return (Number(amount) / 1e6).toFixed(2);
}

import { parseAbi } from 'viem';
import abi from './abi.json';

// Contract addresses (Base Mainnet)
export const CONTRACT_ADDRESS = '0x13a1EC1b4e17D417B23c52adfFCAC978B6e8cB26';
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

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

// Base Mainnet chain config
export const BASE_MAINNET = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.REACT_APP_ALCHEMY_BASE_URL || 'https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
  testnet: false,
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
  [Phase.Joining]: '#7ecda0',
  [Phase.Active]: '#f4a46a',
  [Phase.ProofSubmission]: '#f4a46a',
  [Phase.Voting]: '#b8a9e0',
  [Phase.GracePeriod]: '#b8a9e0',
  [Phase.Completed]: '#a09d98',
};

export const PHASE_BADGE_CLASS = {
  [Phase.Joining]: 'badge-joined',
  [Phase.Active]: 'badge-inprogress',
  [Phase.ProofSubmission]: 'badge-inprogress',
  [Phase.Voting]: 'badge-voting',
  [Phase.GracePeriod]: 'badge-voting',
  [Phase.Completed]: 'badge-completed',
};

export const PHASE_CARD_CLASS = {
  [Phase.Joining]: 'card',
  [Phase.Active]: 'card-progress',
  [Phase.ProofSubmission]: 'card-progress',
  [Phase.Voting]: 'card-voting',
  [Phase.GracePeriod]: 'card-voting',
  [Phase.Completed]: 'card-completed',
};

// USDC ABI for viem (used by smart wallet write operations)
export const USDC_ABI_VIEM = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
]);

// Zero bytes32 constant (used for invite code default)
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

// USDC helpers (6 decimals)
export function parseUSDC(amount) {
  // eslint-disable-next-line no-undef
  return BigInt(Math.round(parseFloat(amount) * 1e6));
}

export function formatUSDC(amount) {
  return (Number(amount) / 1e6).toFixed(2);
}

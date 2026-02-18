const { ethers } = require('ethers');
const FitStakeABI = require('../src/FitStake.json');

const CONTRACT_ADDRESS = '0x920082097e3e0b6f449fdc2225c4a8e3492b6f7c';
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo';

// AI Agent wallets (create these with random private keys)
const agents = [
  //{ name: 'FitBot Alpha', key: ethers.Wallet.createRandom().privateKey },
  { name: 'GymRat AI', key: ethers.Wallet.createRandom().privateKey },
  { name: 'CardioKing', key: ethers.Wallet.createRandom().privateKey }
];

async function runAgent() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  
  for (const agent of agents) {
    const wallet = new ethers.Wallet(agent.key, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, FitStakeABI.abi, wallet);
    
    console.log(`\n${agent.name} (${wallet.address})`);
    
    // Get faucet ETH first (manual step - print address)
    console.log(`➡️ Fund this address: ${wallet.address}`);
    console.log('Waiting 30 seconds for you to send ETH...');
    await new Promise(r => setTimeout(r, 30000));
    
    // Join challenge #1
    try {
      console.log('Joining challenge...');
      const tx = await contract.joinChallenge(1, { value: ethers.utils.parseEther('0.001') });
      await tx.wait();
      console.log('✅ Joined!');
    } catch (e) {
      console.log('❌ Failed:', e.message);
    }
  }
}

runAgent();
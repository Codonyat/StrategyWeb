import { ethers } from 'ethers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables - prefer process.env (Vercel), fallback to .env file (local)
let contractAddress = process.env.VITE_CONTRACT_ADDRESS;
let rpcUrl = process.env.RPC_URL;

// If not in process.env, try to load from .env file (local development)
if (!contractAddress || !rpcUrl) {
  const envPath = join(__dirname, '..', '.env');

  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    contractAddress = contractAddress || env.VITE_CONTRACT_ADDRESS;
    rpcUrl = rpcUrl || env.RPC_URL;
  }
}

// Validate required environment variables
if (!contractAddress) {
  throw new Error('VITE_CONTRACT_ADDRESS environment variable is required');
}
if (!rpcUrl) {
  throw new Error('RPC_URL environment variable is required');
}

// Minimal ABI for the functions we need
const abi = [
  "function deploymentTime() view returns (uint256)",
  "function MINTING_PERIOD() view returns (uint256)",
  "function LOTTERY_PERCENT() view returns (uint256)",
  "function mega() view returns (address)"
];

const provider = new ethers.JsonRpcProvider(rpcUrl);
const contract = new ethers.Contract(contractAddress, abi, provider);

const deploymentTime = await contract.deploymentTime();
const mintingPeriod = await contract.MINTING_PERIOD();
const lotteryPercent = await contract.LOTTERY_PERCENT();
const megaAddress = await contract.mega();

const constants = {
  deploymentTime: deploymentTime.toString(),
  MINTING_PERIOD: mintingPeriod.toString(),
  LOTTERY_PERCENT: lotteryPercent.toString(),
  megaAddress: megaAddress
};

const outputPath = join(__dirname, '..', 'src', 'config', 'contract-constants.json');
writeFileSync(outputPath, JSON.stringify(constants, null, 2));

console.log('Contract constants fetched successfully:');
console.log(constants);

import { ethers } from 'ethers';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = join(__dirname, '..', '.env');
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

const contractAddress = env.VITE_CONTRACT_ADDRESS;
const rpcUrl = env.VITE_RPC_URL;

// Minimal ABI for the functions we need
const abi = [
  "function deploymentTime() view returns (uint256)",
  "function MINTING_PERIOD() view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(rpcUrl);
const contract = new ethers.Contract(contractAddress, abi, provider);

const deploymentTime = await contract.deploymentTime();
const mintingPeriod = await contract.MINTING_PERIOD();

const constants = {
  deploymentTime: deploymentTime.toString(),
  MINTING_PERIOD: mintingPeriod.toString()
};

const outputPath = join(__dirname, '..', 'src', 'config', 'contract-constants.json');
writeFileSync(outputPath, JSON.stringify(constants, null, 2));

console.log('Contract constants fetched successfully:');
console.log(constants);

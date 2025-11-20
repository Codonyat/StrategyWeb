import contractConstants from './contract-constants.json';

// Contract constants fetched at build time
export const DEPLOYMENT_TIME = BigInt(contractConstants.deploymentTime);
export const MINTING_PERIOD = BigInt(contractConstants.MINTING_PERIOD);

// Computed constants
export const MINTING_END_TIME = DEPLOYMENT_TIME + MINTING_PERIOD;

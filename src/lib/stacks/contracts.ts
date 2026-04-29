import {
  makeContractCall,
  broadcastTransaction,
  fetchCallReadOnlyFunction,
  stringAsciiCV,
  principalCV,
  cvToValue,
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';
export const NETWORK = STACKS_MAINNET;

export const CONTRACTS = {
  projectRegistry: 'project-registry',
  partnerRequests: 'partner-requests',
  applications: 'applications',
  partnerships: 'partnerships',
};

export async function registerProject(projectId: string, senderKey: string) {
  const tx = await makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.projectRegistry,
    functionName: 'register-project',
    functionArgs: [stringAsciiCV(projectId)],
    senderKey,
    network: NETWORK,
  });
  return broadcastTransaction({ transaction: tx, network: NETWORK });
}

export async function openPartnerRequest(projectId: string, role: string, senderKey: string) {
  const tx = await makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.partnerRequests,
    functionName: 'open-request',
    functionArgs: [stringAsciiCV(projectId), stringAsciiCV(role)],
    senderKey,
    network: NETWORK,
  });
  return broadcastTransaction({ transaction: tx, network: NETWORK });
}

export async function applyToProject(projectId: string, senderKey: string) {
  const tx = await makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.applications,
    functionName: 'apply',
    functionArgs: [stringAsciiCV(projectId)],
    senderKey,
    network: NETWORK,
  });
  return broadcastTransaction({ transaction: tx, network: NETWORK });
}

export async function acceptPartner(projectId: string, partnerAddress: string, senderKey: string) {
  const tx = await makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.partnerships,
    functionName: 'accept-partner',
    functionArgs: [stringAsciiCV(projectId), principalCV(partnerAddress)],
    senderKey,
    network: NETWORK,
  });
  return broadcastTransaction({ transaction: tx, network: NETWORK });
}

export async function endorsePartner(projectId: string, senderKey: string) {
  const tx = await makeContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.partnerships,
    functionName: 'endorse',
    functionArgs: [stringAsciiCV(projectId)],
    senderKey,
    network: NETWORK,
  });
  return broadcastTransaction({ transaction: tx, network: NETWORK });
}

export async function getProjectOnChain(projectId: string) {
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.projectRegistry,
    functionName: 'get-project',
    functionArgs: [stringAsciiCV(projectId)],
    network: NETWORK,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result);
}

export async function pollTxStatus(txId: string): Promise<'success' | 'pending' | 'failed'> {
  const res = await fetch(`https://api.hiro.so/extended/v1/tx/${txId}`);
  const data = await res.json();
  if (data.tx_status === 'success') return 'success';
  if (data.tx_status === 'pending') return 'pending';
  return 'failed';
}

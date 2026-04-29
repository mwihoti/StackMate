import { mnemonicToSeed } from '/home/mwihotidan/work/projects/stackmate/node_modules/@scure/bip39/index.js';
import { HDKey } from '/home/mwihotidan/work/projects/stackmate/node_modules/@scure/bip32/index.js';
import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  ClarityVersion,
} from '/home/mwihotidan/work/projects/stackmate/node_modules/@stacks/transactions/dist/esm/index.js';
import { STACKS_MAINNET } from '/home/mwihotidan/work/projects/stackmate/node_modules/@stacks/network/dist/esm/index.js';
import { readFileSync } from 'fs';

const MNEMONIC = 'level region spell someone shadow page carry swim master mandate scorpion front general immune dove yellow rose degree depth gate card double garden ball';
const CONTRACTS_DIR = '/home/mwihotidan/work/projects/stackmate/stackmate-contracts/contracts';

// Stuck fees (must be strictly higher for RBF)
const STUCK_NONCE1_FEE = 4_935_195n; // partner-requests
const STUCK_NONCE2_FEE = 4_935_598n; // partnerships
const BUMP = 1000n;

async function main() {
  // Derive private key from mnemonic (Stacks BIP44 path)
  const seed = await mnemonicToSeed(MNEMONIC);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/44'/5757'/0'/0/0");
  const privKey = Buffer.from(child.privateKey).toString('hex') + '01';

  console.log('Deployer key derived. Broadcasting replacements...\n');

  const opts = {
    senderKey: privKey,
    network: STACKS_MAINNET,
    anchorMode: AnchorMode.Any,        // ← the fix: any Nakamoto block (~5s)
    clarityVersion: ClarityVersion.Clarity5,
  };

  // ── Nonce 1: replace stuck partner-requests ──────────────────────────────
  console.log('1/3  partner-requests (nonce 1, RBF)...');
  const tx1 = await makeContractDeploy({
    ...opts,
    contractName: 'partner-requests',
    codeBody: readFileSync(`${CONTRACTS_DIR}/partner-requests.clar`, 'utf8'),
    nonce: 1n,
    fee: STUCK_NONCE1_FEE + BUMP,   // 4,936,195 µSTX — beats stuck tx
  });
  const r1 = await broadcastTransaction({ transaction: tx1, network: STACKS_MAINNET });
  console.log('   txid:', r1.txid ?? JSON.stringify(r1), '\n');

  // ── Nonce 2: replace stuck partnerships ──────────────────────────────────
  console.log('2/3  partnerships (nonce 2, RBF)...');
  const tx2 = await makeContractDeploy({
    ...opts,
    contractName: 'partnerships',
    codeBody: readFileSync(`${CONTRACTS_DIR}/partnerships.clar`, 'utf8'),
    nonce: 2n,
    fee: STUCK_NONCE2_FEE + BUMP,   // 4,936,598 µSTX — beats stuck tx
  });
  const r2 = await broadcastTransaction({ transaction: tx2, network: STACKS_MAINNET });
  console.log('   txid:', r2.txid ?? JSON.stringify(r2), '\n');

  // ── Nonce 3: fresh project-registry ──────────────────────────────────────
  console.log('3/3  project-registry (nonce 3, fresh)...');
  const tx3 = await makeContractDeploy({
    ...opts,
    contractName: 'project-registry',
    codeBody: readFileSync(`${CONTRACTS_DIR}/project-registry.clar`, 'utf8'),
    nonce: 3n,
    fee: 250_000n,                   // 0.25 STX — plenty for low-priority
  });
  const r3 = await broadcastTransaction({ transaction: tx3, network: STACKS_MAINNET });
  console.log('   txid:', r3.txid ?? JSON.stringify(r3), '\n');

  console.log('Done. All 3 replacements broadcast with AnchorMode.Any.');
  console.log('They should confirm within seconds on a Nakamoto block.');
}

main().catch(console.error);

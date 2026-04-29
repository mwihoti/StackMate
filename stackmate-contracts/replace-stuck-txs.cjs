const { mnemonicToSeed } = require('/home/mwihotidan/work/projects/stackmate/node_modules/@scure/bip39');
const { HDKey } = require('/home/mwihotidan/work/projects/stackmate/node_modules/@scure/bip32/lib/index.js');
const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  ClarityVersion,
} = require('/home/mwihotidan/work/projects/stackmate/node_modules/@stacks/transactions/dist/index.js');
const { STACKS_MAINNET } = require('/home/mwihotidan/work/projects/stackmate/node_modules/@stacks/network/dist/index.js');
const { readFileSync } = require('fs');

const MNEMONIC = 'level region spell someone shadow page carry swim master mandate scorpion front general immune dove yellow rose degree depth gate card double garden ball';
const CONTRACTS_DIR = '/home/mwihotidan/work/projects/stackmate/stackmate-contracts/contracts';

const STUCK_NONCE1_FEE = BigInt(4_935_195); // partner-requests
const STUCK_NONCE2_FEE = BigInt(4_935_598); // partnerships
const BUMP = BigInt(1000);

async function main() {
  const seed = await mnemonicToSeed(MNEMONIC);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/44'/5757'/0'/0/0");
  const privKey = Buffer.from(child.privateKey).toString('hex') + '01';

  console.log('Private key derived. Broadcasting...\n');

  const base = {
    senderKey: privKey,
    network: STACKS_MAINNET,
    anchorMode: AnchorMode.Any,
    clarityVersion: ClarityVersion.Clarity3,
  };

  // ── Nonce 1: RBF partner-requests ────────────────────────────────────────
  console.log('1/3  partner-requests (nonce 1, RBF)...');
  const tx1 = await makeContractDeploy({
    ...base,
    contractName: 'partner-requests',
    codeBody: readFileSync(`${CONTRACTS_DIR}/partner-requests.clar`, 'utf8'),
    nonce: BigInt(1),
    fee: STUCK_NONCE1_FEE + BUMP,
  });
  const r1 = await broadcastTransaction({ transaction: tx1, network: STACKS_MAINNET });
  console.log('   result:', JSON.stringify(r1), '\n');

  // ── Nonce 2: RBF partnerships ─────────────────────────────────────────────
  console.log('2/3  partnerships (nonce 2, RBF)...');
  const tx2 = await makeContractDeploy({
    ...base,
    contractName: 'partnerships',
    codeBody: readFileSync(`${CONTRACTS_DIR}/partnerships.clar`, 'utf8'),
    nonce: BigInt(2),
    fee: STUCK_NONCE2_FEE + BUMP,
  });
  const r2 = await broadcastTransaction({ transaction: tx2, network: STACKS_MAINNET });
  console.log('   result:', JSON.stringify(r2), '\n');

  // ── Nonce 3: fresh project-registry ──────────────────────────────────────
  console.log('3/3  project-registry (nonce 3, fresh)...');
  const tx3 = await makeContractDeploy({
    ...base,
    contractName: 'project-registry',
    codeBody: readFileSync(`${CONTRACTS_DIR}/project-registry.clar`, 'utf8'),
    nonce: BigInt(3),
    fee: BigInt(250_000),
  });
  const r3 = await broadcastTransaction({ transaction: tx3, network: STACKS_MAINNET });
  console.log('   result:', JSON.stringify(r3), '\n');

  console.log('All done. Watch for confirmations at:');
  console.log('https://explorer.hiro.so/address/SP23VBSG44YRS452DFHGNZFSPFCMQVQKVRG1TP1C5?chain=mainnet');
}

main().catch(console.error);

# StackMate

**Builder-partner marketplace on Bitcoin L2 (Stacks)**

StackMate connects Stacks developers and founders looking for co-builders. Project owners post partner requests; builders browse, apply, and get accepted — with every key action anchored to the Stacks blockchain via Clarity smart contracts.

---

## What it does

- **Browse projects** — search and filter open partner requests by category
- **Post a project** — register your project on-chain, describe what role you need, and start receiving applications
- **Apply as a partner** — submit a pitch with relevant links; the application is recorded on-chain so it cannot be fabricated
- **Accept a partner** — project owners review applicants and confirm acceptance on-chain, forming a verifiable partnership
- **Mutual endorsement** — both parties can endorse the partnership after it's formed, building an on-chain reputation trail
- **Edit or delete projects** — update name, role, commitment type, and compensation from your dashboard

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Wallet | `@stacks/connect` v8 — Leather wallet |
| On-chain | Clarity smart contracts on Stacks mainnet (Nakamoto epoch 3.4) |
| Off-chain DB | Neon PostgreSQL via `@neondatabase/serverless` |
| ORM | Drizzle ORM |
| Language | TypeScript 5 |

---

## Smart contracts

All four contracts are deployed to Stacks mainnet at:

```
SP23VBSG44YRS452DFHGNZFSPFCMQVQKVRG1TP1C5
```

### `project-registry`

Registers projects on-chain. Each project is identified by an off-chain UUID generated at creation time.

| Function | Description |
|---|---|
| `register-project(id)` | Anchors a new project to the sender's principal |
| `set-looking-for-partner(id, status)` | Owner toggles the open/closed state |
| `get-project(id)` | Read-only — returns owner, status, and block height |
| `get-owner-count(owner)` | Read-only — number of projects owned by a principal |

Error codes: `u100` already registered · `u101` project not found · `u102` not the owner

---

### `partner-requests`

Records partner request metadata on-chain (role type, commitment level).

---

### `applications`

Records builder applications on-chain.

| Function | Description |
|---|---|
| `apply(project-id)` | Submits an application; prevents duplicate applications (`u300`) |
| `update-status(project-id, applicant, status)` | Updates application status (`"pending"` → `"accepted"` / `"rejected"`) |
| `get-application(project-id, applicant)` | Read-only lookup |

---

### `partnerships`

Records accepted partnerships and mutual endorsements.

| Function | Description |
|---|---|
| `accept-partner(project-id, partner)` | Owner confirms a partnership on-chain |
| `endorse(project-id)` | Either party can endorse; builds on-chain reputation |
| `get-partnership(project-id)` | Read-only — returns both principals, block height, and endorsement flags |

Error codes: `u400` partnership not found · `u401` caller is not a party to this partnership

---

## Database schema

Four tables in Neon PostgreSQL mirror the on-chain state and store rich off-chain data (descriptions, pitches, links).

```
projects
  id                   uuid PK
  owner_address        text
  name                 text
  category             text
  description          text
  website              text
  github               text
  team_members         jsonb
  looking_for_partner  boolean
  tx_id                text        ← on-chain transaction ID
  created_at           timestamp

partner_requests
  id            uuid PK
  project_id    uuid FK → projects.id
  role          text
  skills        jsonb
  commitment    text        (part-time | full-time | flexible)
  compensation  text        (equity | bounty | volunteer | salary)
  description   text
  is_open       boolean
  tx_id         text
  created_at    timestamp

applications
  id                 uuid PK
  project_id         uuid FK → projects.id
  applicant_address  text
  pitch              text
  links              jsonb
  skills             jsonb
  status             text    (pending | accepted | rejected)
  tx_id              text
  created_at         timestamp

partnerships
  id                    uuid PK
  project_id            uuid FK → projects.id
  partner_address       text
  owner_address         text
  endorsed_by_owner     boolean
  endorsed_by_partner   boolean
  tx_id                 text
  formed_at             timestamp
```

---

## Data flow

```
User connects wallet (Leather)
         ↓
Action in UI (post project, apply, accept partner)
         ↓
openContractCall() → Leather signs → Stacks mainnet
         ↓  (tx ID returned in onFinish callback)
POST/PATCH /api/* → Neon PostgreSQL (off-chain record with tx_id)
         ↓
Poll https://api.hiro.so/extended/v1/tx/{txId} every 3s
         ↓
TxStatus component shows: pending → success / failed
```

Off-chain data (descriptions, pitches, rich metadata) lives in Postgres. On-chain data (ownership, status flags, endorsements) lives in the Clarity contracts. The `tx_id` column links each DB record to its on-chain proof.

---

## Project structure

```
src/
  app/
    page.tsx                    # Home — browse & filter open projects
    dashboard/page.tsx          # User dashboard — my projects & applications
    projects/
      new/page.tsx              # Post a new project
      [id]/page.tsx             # Project detail, apply, accept partner
    api/
      projects/route.ts         # GET (list) · POST (create)
      projects/[id]/route.ts    # GET (detail) · PATCH (edit) · DELETE
      applications/route.ts     # GET · POST (apply / accept)
  components/
    projects/ProjectCard.tsx
    wallet/WalletButton.tsx
    ui/TxStatus.tsx
  contexts/
    WalletContext.tsx            # Shared wallet state across all pages
  hooks/
    useWallet.ts
    useProjects.ts
    useApplications.ts
  lib/
    db/
      index.ts                  # Neon + Drizzle client
      schema.ts                 # All four table definitions
  types/index.ts

stackmate-contracts/
  contracts/
    project-registry.clar
    partner-requests.clar
    applications.clar
    partnerships.clar
  Clarinet.toml
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- [Leather wallet](https://leather.io) browser extension
- Stacks mainnet STX for gas (if deploying contracts yourself)

### Install

```bash
git clone https://github.com/your-username/stackmate
cd stackmate
npm install
```

### Environment variables

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/neondb?sslmode=require
NEXT_PUBLIC_CONTRACT_ADDRESS=SP23VBSG44YRS452DFHGNZFSPFCMQVQKVRG1TP1C5
```

### Set up the database

```bash
npm run db:push        # Push schema directly to Neon (first time / dev)
# or with migrations
npm run db:generate    # Generate migration files from schema changes
npm run db:migrate     # Apply pending migrations
```

### Run locally

```bash
npm run dev            # http://localhost:3000
```

### Build for production

```bash
npm run build
npm start
```

---

## API reference

### `GET /api/projects`

Returns all projects with `looking_for_partner = true`.

**Query params:**
- `ownerAddress` — if provided, returns only projects owned by this address (used by the dashboard)

### `POST /api/projects`

Creates a project and its partner request.

```json
{
  "project": {
    "id": "uuid",
    "owner_address": "SP...",
    "name": "My Project",
    "category": "DeFi",
    "description": "...",
    "website": "https://...",
    "github": "https://github.com/...",
    "team_members": [{ "address": "SP...", "role": "Owner" }],
    "tx_id": "0x..."
  },
  "request": {
    "role": "Frontend Developer",
    "skills": ["React", "TypeScript"],
    "commitment": "part-time",
    "compensation": "equity",
    "description": "...",
    "tx_id": "0x..."
  }
}
```

### `GET /api/projects/[id]`

Returns `{ project, partnerRequest }` for a single project.

### `PATCH /api/projects/[id]`

Updates project and/or partner request fields. Requires `owner_address` in body for authorization.

Updatable fields: `name`, `description`, `website`, `github`, `looking_for_partner`, `role`, `commitment`, `compensation`

### `DELETE /api/projects/[id]`

Deletes the project and all child records (partner requests, applications, partnerships). Requires `owner_address` in body.

### `GET /api/applications?projectId=[id]`

Returns all applications for a project (owner view) or all applications by a wallet address.

### `POST /api/applications`

**Apply:**
```json
{
  "action": "apply",
  "project_id": "uuid",
  "applicant_address": "SP...",
  "pitch": "Why I'm a great fit...",
  "links": ["https://github.com/..."],
  "tx_id": "0x..."
}
```

**Accept:**
```json
{
  "action": "accept",
  "project_id": "uuid",
  "applicant_address": "SP...",
  "owner_address": "SP...",
  "tx_id": "0x..."
}
```

---

## Categories

`DeFi` · `Gaming & Interactive` · `AI & Agents` · `Fintech & Payments` · `Commerce & Marketplaces` · `Developer Tools & Infrastructure` · `Education` · `Consumer Apps` · `Other`

## Partner roles

`Frontend Developer` · `Backend Developer` · `Smart Contract Developer` · `Blockchain Developer` · `UI/UX Designer` · `Product Manager` · `Marketing` · `Community Manager` · `Other`

## Commitment levels

`part-time` · `full-time` · `flexible`

## Compensation types

`equity` · `bounty` · `volunteer` · `salary`

---

## Deploying the contracts

The contracts are already live. If you need to redeploy (e.g. fork or testnet):

```bash
cd stackmate-contracts

# Install Clarinet
curl -fsSL https://github.com/hirosystems/clarinet/releases/download/v3.x.x/clarinet-linux-x64.tar.gz | tar -xz
sudo mv clarinet /usr/local/bin

# Check contracts
clarinet check

# Generate deployment plan
clarinet deployments generate --mainnet --low-cost

# Apply
clarinet deployments apply -p deployments/default.mainnet-plan.yaml
```

> **Note:** In Nakamoto (epoch 3.4), use `AnchorMode.Any` in programmatic deployments. The default `on_chain_only` anchor mode requires a tenure-change block, which can cause transactions to sit in the mempool for hours.

---

## Stacks Builder Rewards

StackMate is submitted to the [Stacks Builder Rewards](https://stacks.org) program. It demonstrates a complete full-stack dApp pattern on Stacks Nakamoto:

- Clarity 3 contracts using `stacks-block-height` (epoch 3.4 compatible)
- Wallet connection via `@stacks/connect` v8 with shared React Context state
- Hybrid on-chain + off-chain architecture with Neon PostgreSQL
- Transaction status polling via the Hiro API

---

## License

MIT

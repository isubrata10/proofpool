# ProofPool

**Private contributions. Public impact. Verifiable eligibility.**

ProofPool is a privacy-preserving pooled funding application built on Midnight. It allows users to contribute to a funding pool privately, maintaining public participation counts without leaking individual financial data.

## Privacy Model

### Public
- **Funding Target**: The overall goal of the pool.
- **Eligibility Threshold**: The minimum amount required to prove eligibility.
- **Total Contributors**: The count of unique participants in the pool.
- **Commitments**: A map of public contributor IDs to cryptographic commitments.

### Private
- **Contribution Amount**: The exact value of a user's contribution. It is passed as a private witness, never disclosed on-chain, and never leaked via state deltas.
- **Secret**: A high-entropy salt used to generate the commitment.

### Proven
The user knows the private amount and secret corresponding to their stored commitment, and the amount satisfies the public eligibility threshold.

### Not Provided
- **Wallet Authentication**: The contributor ID is NOT automatically authenticated by the wallet. In this MVP, anyone can generate random IDs. (A production version would require signatures or verified wallet public keys).
- **Storage Confidentiality**: The private witness is retained locally in the browser for convenience. The privacy guarantee comes from the cryptographic commitment and zero-knowledge verification, not from browser storage security.

## Running the Project

```bash
npm install
npm run dev
```

For deployment and integration, refer to `docs/USAGE.md`.

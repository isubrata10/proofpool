# ProofPool Proposal

## Overview
ProofPool solves the privacy dilemma in decentralized funding. Public ledgers expose individual contribution amounts, while fully private ledgers make it difficult to prove funding milestones and eligibility.

## Product Value
By utilizing Midnight's confidential smart contracts (Compact), ProofPool offers:
- **Confidentiality**: Individual contribution amounts are securely committed on-chain and hidden from delta-inference attacks.
- **Transparency**: The aggregate participant count, funding target, and eligibility threshold are public.
- **Utility**: Contributors can prove eligibility (e.g., for NFT drops, voting) using zero-knowledge proofs mathematically bound to their historical contributions.

## Technical Architecture
- **Midnight Network (Preprod)**
- **Compact Smart Contracts**: Utilizing `persistentHash` for on-chain commitments.
- **React / Vite Frontend**
- **Lace Wallet Integration**

## Privacy Model
- **Public**: `funding_target`, `eligibility_threshold`, `total_contributors`.
- **Private**: The exact contribution amount and the secret used to generate the commitment.
- **Proof**: Asserting `amount >= eligibility_threshold` while verifying `persistentHash(amount, secret) == stored_commitment`.

### Identity Limitation
The contributor ID is an unauthenticated public commitment identifier. It is not automatically authenticated by the wallet. In this MVP, any user can generate random IDs, though they are prevented from overwriting an existing ID. The private witness is retained in browser local storage for convenience, but the privacy model relies entirely on ZK proofs.

# Poker privacy, fairness, and trust
Date: 2026-10-10  
POC: Project owner  
TL;DR: Hidden cards, fair shuffling, custody, account privacy, and public-chain metadata are separate properties. A product needs evidence for each; one “decentralized” label cannot cover them all.

[Wiki index](README.md) | [Competitor fees](competitor-comparison.md) | [Product implications](product-positioning.md)

## The properties to compare

| Property | Question | Evidence needed |
| --- | --- | --- |
| Card secrecy | Can the operator, another player, or a chain observer learn an unrevealed hole card? | Protocol specification, key ownership, disclosure timeline, and tests against collusion assumptions. |
| Shuffle integrity | Can a participant bias or substitute the deck without detection? | Shuffle proof or verifiable transcript, verifier implementation, and independently reproducible checks. |
| Rule enforcement | Who rejects an invalid bet, action order, or claimed winner? | State-transition rules, consensus requirements, and contract adjudication. |
| Funds control | Who can move or freeze deposits and winnings? | Deployed escrow/vault code, privileged roles, withdrawal conditions, and recovery paths. |
| Account privacy | Which identities, addresses, devices, and IPs are collected? | Terms, privacy policy, actual account workflow, and retention/access practices. |
| Metadata privacy | Which wallet, table, timing, amount, or player relationships become public? | Contract storage/events, indexers, and network traffic analysis. |
| Availability | What happens when a player or service disappears? | Timeouts, abandonment rules, reconnection and dispute tests. |

These are analytical categories, not claims that the reviewed competitors implement them.

## Technical comparison

| Product | Hidden cards and dealing | Who verifies? | Funds and identity qualifications |
| --- | --- | --- | --- |
| Vara / Gear ZK Poker | Vara describes private cards with proof-backed player shuffling and dealing. [1, lines 6-12] | Gear describes mental poker and ZK verification intended to remove the trusted dealer. [2, lines 68-76] The reviewed announcements do not establish actual verifier deployment or audit scope. | Real-money escrow, privileged roles, fees, and KYC are not established by those sources. |
| Cardano zkPoker | Its proposal describes Threshold ElGamal for group-encrypted data with individual-player privacy. [3, lines 108-118] | The intended preproduction flow includes wallet-to-table funding, a session, and distribution back to wallets. [3, lines 112-118] | A proposed noncustodial architecture is not confirmation of a current production escrow. |
| zkHoldem | The project article describes each player shuffling an encrypted deck and decrypting only their own hole cards. [4, lines 76-105] | It says zkShuffle and a Poseidon zkContract verify dealing. [4, lines 94-105] | The article does not establish current deployed contracts, withdrawal roles, account policy, or metadata protection. |
| Virtue Poker | A December 2021 Poker.org report says the shuffle was conducted in part by each player's computer and cards were read by combining keys from the involved computers. [6, lines 398-403] | The historical design cannot substantiate a current verification workflow. | The January 2025 leadership announcement leaves present operation unresolved. [5, lines 18-21] |
| CoinPoker | It advertises a player-contributed KECCAK-256 RNG and post-hand checking, including undealt cards. [10, lines 238-282] This alone does not establish operator-blind hole cards during play. | The reviewed page does not supply a named auditor, audit scope, or a reproduced verification procedure. | Terms allow identity/source-of-funds checks and withdrawal restrictions. [11, lines 449-509] Platform server records determine outcomes. [11, lines 623-629] |
| Blockchain Poker | Dealing and operator visibility were not established in reviewed primary sources. | No reproducible public shuffle-verification procedure found in this source set. | Claims of cryptocurrency support and rakeback do not establish noncustodial withdrawal or account anonymity. |
| PlayBlind | It claims per-player encrypted cards, “zero-knowledge dealing,” and servers unable to read holes. [15, lines 15-29] | It claims on-chain hand verification but supplies no method, proof example, or contract addresses in the reviewed page. [15, lines 25-29] | It says USDC chips reside in on-chain vaults. [15, lines 29-29] Vault ownership, upgrade roles, and withdrawal enforcement remain unverified. |

## Why post-hand verification is a narrower claim

A transcript or RNG check can show that a recorded deck followed a rule. It does not automatically show that the operator could not see the deck before betting, that no player was shown extra information, or that a withdrawal cannot be blocked.

CoinPoker presents reserve coverage and RNG fairness as separate claims. [10, lines 238-282] The fetched reserve section contains no usable reserve addresses, dated liabilities proof, or independent attestation. A reserve claim should be evaluated independently of a dealing claim.

A useful vendor assessment asks for a verifier the reader can run, the inputs it consumes, the property it proves, and the adversary assumptions. “ZK,” “BLS,” and “provably fair” are not substitutes for those answers.

## Information revealed after a hand matters

A design can keep holes secret while betting and disclose more information during verification. The disclosure policy affects whether folded hands stay private and whether previously revealed material can compromise later hands.

For Private Poker, inspect the exact protocol and transcript before promising permanent secrecy for folded cards. Use per-hand secrets with documented lifetimes. A transport authentication key and a card-masking key have different purposes and should not be treated as interchangeable.

This page does not infer a disclosure policy for any competitor whose source omits it.

## Identity, KYC, and public addresses

CoinPoker can request identification, address, source-of-funds information, and re-verification, and can share information with compliance-related parties. [11, lines 449-509] Account-opening marketing should therefore not become an unconditional “anonymous poker” statement.

PlayBlind says ordinary play requires no KYC and permits Google or wallet sign-in. [14, lines 39-45] That claim does not demonstrate absence of account identifiers, network logs, or future compliance exceptions.

A wallet address is an identifier even when no legal name is supplied. Table membership, buy-ins, payouts, and timing can make separate sessions linkable. Private Poker’s public-chain exposure should be measured by reading its actual storage, events, transactions, and frontend indexer behavior. No competitor should receive a “private wallet graph” rating without equivalent evidence.

## Transport privacy is separate from game cryptography

Peer-to-peer messaging can remove an operator from the gameplay data path while exposing network information to another peer. Signalling and STUN/TURN infrastructure have their own metadata and availability roles.

BLS signatures authenticate messages; they do not by themselves encrypt those messages or hide a participant’s network address. Card masking protects a different asset. The product’s threat model should name both the data and the adversary instead of promising broad anonymity.

## Private Poker: local architecture and claim boundaries

The project notes identify `private-poker` as the canonical frontend and `crumble` as the protocol library. This wiki is stored in the requested Vite docs directory; it does not make the held Vite app canonical.

Relevant local descriptions:

- [P2P boundary](../p2p.md): app networking and library ownership.
- [Hand lifecycle](../table-hand-gameplay-flow.md): signed action flow, hand start, verification, and settlement.
- [Table creation](../create-table-flow.md): CHIPS approvals/buy-ins and operator prerequisites.
- `src/lib/constants.js`: test-network/demo disclaimer and subscription-tier configuration.

The intended trust proposition is peer-controlled cryptographic gameplay with Arbitrum verification and settlement. This investigation did not independently validate every deployed contract path, audit the cryptography, establish mainnet readiness, or measure liveness against malicious peers.

Before publishing comparative security claims:

1. Map card, transport, wallet, and operator keys to their owners and lifetimes.
2. State precisely what the shuffle and unmasking verifiers prove.
3. Publish the deployed verifier addresses, code/version, and sample transcript.
4. Check hidden-card disclosure before, during, and after verification.
5. Enumerate contract privileged roles, upgrades, pause powers, and withdrawal authority.
6. Test invalid actions, withholding, disconnects, duplicate messages, replay, and settlement failure.
7. List public fields and events that link a player to a table or payout.
8. Explain which protections do not cover collusion, endpoint compromise, bots, or service outages.

A documented threat model and reproducible evidence are stronger differentiation than an unsupported superlative.

## References

- [1] ZK Poker | Vara Network | https://vara.network/ecosystem/zk-poker
- [2] A New Format for a Legendary Game: ZK Poker Is Live | https://gear-tech.io/news/a-new-format-for-a-legendary-game-zk-poker-is-live
- [3] zkPoker Development | https://projectcatalyst.io/funds/15/cardano-use-cases-prototype-and-launch/zkpoker-development
- [4] Introducing zkHoldem - Decentralized Poker Room as a Reality | https://zkholdem.medium.com/introducing-zkholdem-decentralized-poker-room-as-a-reality-ee5a6a1476b
- [5] Virtue Poker co-founder stepping-down announcement | https://x.com/Virtue_Poker/status/1878127418881589590
- [6] Virtue Poker just lauched a free-to-play play-to-earn platform | https://www.poker.org/latest-news/virtue-poker-just-lauched-a-free-to-play-play-to-earn-platform-aVn3Z8p7NrHy/
- [7] CoinPoker | Best Online Poker Site for Real Money 2026 | https://coinpoker.com/
- [8] Poker Rake on CoinPoker: Game Fees Guide for Players | https://coinpoker.com/rake/
- [9] How to Withdrawals Work on CoinPoker | Full Guide | https://coinpoker.com/deposits-and-withdrawals/withdrawals/
- [10] On-Chain Proof of Reserves | CoinPoker Crypto Poker | https://coinpoker.com/trust-coinpoker/
- [11] CoinPoker Terms and Conditions of Use | https://coinpoker.com/wp-content/uploads/2026/03/Terms-and-Conditions-2026-CoinPoker-.pdf
- [12] Why Blockchains Need Instant Finality in 2026 | https://blog.blockchain.poker/p/why-blockchains-need-instant-finality
- [13] The Infinite Money Glitch? Let's Actually Do the Math | https://blog.blockchain.poker/p/the-infinite-money-glitch-lets-actually
- [14] CoinPoker vs PlayBlind: What Is the Best Crypto Poker Site? | https://playblind.com/blog/coinpoker-vs-playblind
- [15] What Is Provably Fair Poker? | PlayBlind | https://playblind.com/provably-fair-poker
- [16] Deposits and Withdrawals - Guide to the CoinPoker Cashier | https://coinpoker.com/deposits-and-withdrawals/
- [17] Blockchain.Poker Affiliate Program | https://affiliates.blockchain.poker/
- [18] Insta-Pok3r: Real-time Poker on Blockchain | https://eprint.iacr.org/2024/1061
- [19] pokerdao.xyz | https://pokerdao.xyz/
- [20] PokerFi price today, POKERFI to USD live price, marketcap and chart | CoinMarketCap | https://coinmarketcap.com/currencies/pokerfi/
- [21] Pricing | Calendly | https://calendly.com/pricing
- [22] Pricing | Cal.com | https://cal.com/pricing
- [23] Plans & Pricing · SavvyCal | https://savvycal.com/pricing
- [24] Meetings & Embedded pricing | Whereby | https://whereby.com/information/pricing
- [25] Jitsi Meet Security & Privacy | Jitsi | https://jitsi.org/security/
- [26] Zoom Workplace Pricing - Zoom | https://zoom.us/pricing
- [27] Google Meet: Online Web and Video Conferencing Calls | Google Workspace | https://workspace.google.com/products/meet/
- [28] Learn about features in Google Meet | https://support.google.com/meet/answer/13396001
- [29] Poker Now - Poker with Friends | https://www.pokernow.club/
- [30] Poker Now - Plus | https://www.pokernow.club/subscription/plus
- [31] Virtual Coffee Program | Slack Channel Templates by Donut | https://donut.com/templates/virtual-coffee-program/
- [32] Understanding Gather’s pricing changes (2025) | https://support.gather.town/articles/2500085119-understanding-gather-s-pricing-changes-2025
- [33] Poker Now - Changes on Video/Voice Chat on Poker Now through Jitsi | https://network.pokernow.club/blog/changes-video-voice-chat-poker-now-jitsi
- [34] Poker Now - Privacy Policy | https://network.pokernow.club/privacy
- [35] Cal.diy — community open-source scheduling platform | https://github.com/calcom/cal.com
- [36] Security at Whereby | Whereby | https://whereby.com/information/security
- [37] Using end-to-end encryption (E2EE) in Zoom meetings | https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065408
- [38] Learn about call & meeting encryption in Google Meet | https://support.google.com/meet/answer/12387251
- [39] Your privacy and security | Calendly Help | https://calendly.com/help/your-privacy-and-security
- [40] Privacy Policy | Cal.com | https://cal.com/privacy
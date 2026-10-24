# Private Poker: competitive implications and priorities
Date: 2026-10-10  
POC: Project owner  
TL;DR: Differentiate through inspectable player-controlled dealing and settlement evidence. Establish the complete fee stack and failure behavior before making production or low-cost claims.

[Wiki index](README.md) | [Competitor comparison](competitor-comparison.md) | [Privacy and trust](privacy-and-trust.md)

## Research conclusions

The closest design comparisons are Vara/Gear ZK Poker, Cardano zkPoker, zkHoldem, and the historical Virtue Poker design. Their source sets do not provide a reliable, complete current player-fee comparison. Commercial rooms are still useful benchmarks for onboarding, game availability, and economic disclosure, even where their trust model differs.

CoinPoker publishes cash rake, stake/player-count caps, a separate heads-up schedule, and tournament fee ranges. [8, lines 254-304] PlayBlind advertises zero rake and operator-blind cards. [14, lines 39-55] Matching the latter headline without technical or economic evidence would add little credibility.

The research does not establish market share, active liquidity, conversion rates, customer demand, or which protocol is safest. These recommendations are product hypotheses and engineering priorities, not market validation.

## Proposed positioning hypothesis

> Poker dealt by the players' browsers, with cryptographic evidence for verification and blockchain settlement.

This is an intended product proposition. Any public version must identify which parts are live in the current build, which network is used, and what a user can verify. Keep the test-network/demo status visible. Do not describe this investigation as proof of production security or guaranteed withdrawals.

The project context identifies `private-poker` as the canonical frontend and `crumble` as the protocol library. The Vite app is on hold and hosts this wiki only because it was the requested destination.

## Priority 0: publish the proof and trust boundary

Deliverables:

- A diagram of gameplay, signalling, wallet, cashier, operator, and contract responsibilities.
- An explanation of shuffle/unmask verification with exact verifier inputs and properties.
- A sample hand transcript with independent verification instructions.
- Deployed contract addresses and versions for the network being demonstrated.
- The privileged-role and upgrade model for funds contracts.
- A disclosure timeline for hole cards, folded cards, and verification material.

Acceptance criterion: an engineer outside the project can reproduce a sample verification and tell which entities must remain honest or available. This investigation has not completed those deliverables.

## Priority 1: disclose and measure all costs

Use the local [table creation flow](../create-table-flow.md) and [hand lifecycle](../table-hand-gameplay-flow.md) as starting points, then verify actual calls and costs.

| Layer | What to disclose | Measurement or confirmation |
| --- | --- | --- |
| Chips funding | Token amount, approvals, cashier conversion, and redemption terms. | Exercise deposit/buy-in/redemption on the stated network. |
| Table access | Any subscription, lobby, creation, or joining charge. | Reconcile frontend configuration with contract behavior and public pricing. |
| Hand execution | Rake, entry fee, verification, settlement, and who submits transactions. | Trace a complete hand and identify paid operations. |
| Operator | Gas funding, service fee, and failure/availability assumptions. | Compare operator-funded and player-funded paths. |
| Exit | Withdrawal, network, bridge, and conversion costs. | Test a full exit rather than only a winning settlement. |
| Rewards | Eligibility and formula for any rebates. | Separate rewards from gross cost. |

Publish amounts as a dated quote or measured example, with network and assumptions. Sepolia test gas is not a real-money estimate. Do not compare a simulated zero-cost hand to a commercial room's cash-game rake as if the products had equivalent costs and availability.

## Priority 2: demonstrate failure and recovery

Test the protocol and settlement lifecycle with:

- A peer leaving during shuffle, dealing, betting, and proof submission.
- A withheld or invalid unmasking share.
- Duplicate, delayed, reordered, and replayed messages.
- An incorrect claimed pot or winner.
- Wallet rejection, RPC delay, reverted settlement, and chain interruption.
- A missing operator or an operator that submits the wrong data.
- Refresh/rejoin behavior and key continuity.

Publish who can recover funds, how long it takes, and which actor pays. A fair shuffle without a workable abandonment rule may still create an unusable table.

## Priority 3: validate onboarding and demand

Candidate audiences, all unvalidated:

- Crypto-native home-game hosts who already understand wallets.
- Technical privacy/fairness enthusiasts willing to inspect protocol evidence.
- Poker communities interested in independent table control.

Run interviews and guided test sessions before broad positioning. Measure completed join-to-hand flows, key-generation friction, connection success, abandoned transactions, time to first hand, and recovery success. Do not imply protection against collusion, bots, or compromised devices simply because the dealing protocol is cryptographic.

## Claim-to-evidence checklist

| Proposed claim | Evidence required before publication |
| --- | --- |
| “The operator cannot read your hole cards” | Threat model, key ownership, protocol review, disclosure timeline, and adversarial test evidence. |
| “Verifiable hands” | Public verifier, transcript format, independent reproduction, and clarity about what is proved. |
| “Noncustodial” | Escrow/cashier roles, withdrawal authority, upgrades, pause powers, and recovery rules. |
| “Low fees” | Comparable whole-session scenario including rake, gas, subscription, and exit costs. |
| “Anonymous” | Identity and network metadata analysis, public-chain linkage, and actual collection/compliance rules. |
| “Decentralized” | Explicit dependencies and authority at each layer, including frontend delivery, signalling, operators, and contracts. |

## Next evidence pass

Obtain current product/contract documentation from zkHoldem, Virtue Poker, and the Vara/Gear demo before treating them as operating services. Obtain PlayBlind's vault/verifier addresses, audit/code links, withdrawal terms, and full fee policy. Obtain Blockchain Poker's player rake/cap schedule rather than inferring it from affiliate commissions.

A hands-on competitor pass needs separate authorization for accounts, deposits, and gambling activity. None was performed here.

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
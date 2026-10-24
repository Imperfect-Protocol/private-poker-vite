# Decentralized poker competitors: fees and product status

Date: 2026-10-10  
POC: Project owner  
TL;DR: Mental-poker projects are the closest architectural comparisons. CoinPoker provides the clearest published commercial fee benchmark. Crypto payments, reserve claims, and “provably fair” branding do not establish player-controlled dealing or permissionless settlement.

[Wiki index](README.md) | [Privacy and trust](privacy-and-trust.md) | [Product implications](product-positioning.md)

## How to read this comparison

This is desk research using official documentation, terms, project publications, and limited historical secondary reporting. No accounts were created, games played, balances deposited, or contracts audited. “Reviewed” means the source was retrieved on the date above, not that the service was tested.

A project statement establishes what the project claims. A launch announcement does not establish current liquidity, reliable withdrawals, or security. “Not found” means the reviewed sources did not supply the answer; it does not mean the feature or fee does not exist.

## Competitor matrix

| Product | Category and status evidence | Published player costs | Privacy and trust qualification |
| --- | --- | --- | --- |
| Vara / Gear ZK Poker | Vara lists a live, open-source ZK poker demo dated January 15, 2026. [1, lines 6-12] Gear announced ZK Poker live on January 27, 2026. [2, lines 68-76] Treat these as one likely project, not two competitors. | No player rake, tournament, withdrawal, or gas schedule found in these sources. | The ecosystem listing describes player shuffling/dealing with smart contracts and ZK proofs that keep cards hidden. [1, lines 6-12] Real-money custody, deployed verifiers, and audit scope are not established here. |
| Cardano zkPoker / cPoker | A funding proposal describes an existing Hydra-testable iteration and a proposed non-Hydra preproduction MVP. [3, lines 108-118] Proposal milestones are not independent launch confirmation. | No player fee schedule found. Development funding is not player cost. | The proposed mental-poker design uses Threshold ElGamal and contract-mediated table funding and distribution. [3, lines 108-118] The proposal excludes legal/compliance work and says auditing is unaffordable in that phase. [3, lines 127-130] |
| zkHoldem | Its project-authored January 2023 article expected a beta in Q1 2023. [4, lines 113-117] Current operation and any rebrand remain unconfirmed. | No rake, tournament, withdrawal, or gas schedule found in the article. | The article describes sequential encrypted player shuffles, individual hole-card decryption, and smart-contract verification. [4, lines 76-105] This is a design claim, not a reproduced deployment test. |
| Virtue Poker | The official account said in January 2025 that its co-founder was stepping down and it would remain operational “for now” while seeking future direction. [5, lines 18-21] Current operation is unconfirmed. | No reliable current official fee schedule found. | A December 2021 Poker.org report describes a smart-contract cashier and shuffling/key contributions on players’ computers. [6, lines 380-424] Historical secondary evidence must not be presented as current assurance. |
| CoinPoker | Its current website advertises cash games and tournaments. [7, lines 240-263] Included as a crypto-funded, operator-controlled room, not an established mental-poker equivalent. | Published cash rake is 5%, subject to caps; tournaments are listed at 2% to 8%. [8, lines 254-280] Withdrawal charges vary by method and network. [9, lines 298-325] | It claims player-contributed RNG, post-hand checking, and 1:1 reserves. [10, lines 238-282] Its terms allow identity/source-of-funds checks and withdrawal restrictions. [11, lines 449-509] |
| Blockchain Poker | In a July 3, 2026 operator-authored post, Blockchain Poker says it supports XEC, BTC, BCH, LTC, and FIRMA. [12, lines 50-58] The post does not establish custody or wallet control. A working real-money table and withdrawal path were not tested. | The official blog advertises “low rake” and standard rakeback up to 100%, subject to terms. [13, lines 28-38] The underlying rate, caps, and eligibility rules were not found. | The reviewed official material does not establish operator-blind cards, noncustodial funds, or a public shuffle-verification procedure. |
| PlayBlind | A September 2026 first-party article advertises USDC poker, Google/wallet sign-in, and encrypted cards. [14, lines 37-55] Actual service and technical claims were not tested. | It advertises 0% cash-game rake. [14, lines 14-25] It attributes funding to advertising and sponsors. [14, lines 39-45] Withdrawal charges and total transaction costs are not established. | It claims server-blind dealing, on-chain verification, and USDC vaults on Ethereum, Arbitrum, and Base. [15, lines 25-29] The reviewed page supplies no contract addresses, technical protocol, audit, or reproducible verification instructions. |

The Vara/Gear consolidation is an editorial inference from matching product names, ecosystem, attribution, and descriptions. The Cardano project and zkHoldem remain separate products.

## CoinPoker: the usable fee benchmark

CoinPoker’s rake page was marked updated October 8, 2026 and lists 5% cash-game rake, flat-fee All-In or Fold games, and tournament fees of 2% to 8%. [8, lines 240-258] Rakeback is a separate benefit; subtracting its headline maximum from gross rake would require the actual eligibility and reward calculation.

### Cash-game caps

The general cash-game table lists these examples: [8, lines 269-287]

| Stakes | Two-player cap | Three/four-player cap | Five-plus-player cap | Rake |
| --- | --- | --- | --- | --- |
| $0.01/$0.02 | $0.05 | $0.12 | $0.20 | 5% |
| $0.10/$0.25 | $0.50 | $1.20 | $2.00 | 5% |
| $0.50/$1 | $1.25 | $3.00 | $5.00 | 5% |
| $1/$2 | $1.50 | $3.60 | $6.00 | 5% |

A separate “Heads Up Games” table lists different caps, including $0.06 at $0.01/$0.02 and $1.80 at $1/$2. [8, lines 289-304] Do not label the general two-player column as the dedicated heads-up schedule. Confirm which table applies before quoting a cost for a specific game.

Worked illustration, not a gameplay measurement: assuming an eligible $10 pot at $1/$2 in the general five-plus-player category, 5% is $0.50, below the published $6 cap. An eligible $200 pot would reach that cap. This excludes rewards, any special-table rules, deposits, and withdrawals.

### Withdrawal costs

The September 22, 2026 withdrawal guide lists USDT at 5 USDT, BTC at approximately 1 USDT, USDC at 0 to 5 USDT, and Luxon Pay at no fee. It further states Polygon USDT/USDC withdrawals have no fee and Ethereum withdrawals cost 5 USDT, and tells users to check the cashier for updated rates. [9, lines 298-325]

Treat those network-specific details as essential qualifiers to the generic currency table. A deposit network transaction, bridge, or exchange conversion can create an additional cost; this research did not measure those costs. Do not promise an all-inclusive zero-cost withdrawal from a currency name alone.

### KYC and operator authority

CoinPoker’s cashier marketing describes no verification requirements. [16, lines 402-406] Its terms nevertheless permit checks of identity, age, address, payment ownership, source of funds and wealth, and suspension or restriction of withdrawals while verification is pending. [11, lines 449-509]

The terms define the player Wallet as a platform virtual account. [11, lines 291-297] They also give the platform’s server records authority in determining transactions and outcomes. [11, lines 623-629] This does not establish user-controlled contract settlement.

## Other fee claims that need careful labels

### Blockchain Poker

The official affiliate program quotes commissions of 8% of referred players’ generated rake and 10% to 30% for referred verified affiliates. [17, lines 48-63] These are affiliate revenue shares, not the rake percentage charged to players.

“Up to 100% rakeback” is also not a published zero-rake schedule. The missing items are the gross rake, cap, qualifying-hand rule, qualifying-player rule, and reward formula. Retain “not established” until those terms are obtained.

### PlayBlind

PlayBlind states zero rake and no KYC for normal use. [14, lines 39-45] It advertises direct withdrawals without a holding period or approval within a $750,000 rolling 24-hour limit. [14, lines 75-83] These are the company’s assertions. They do not establish that withdrawals have no gas or other charge, that contracts enforce those terms, or that legal exceptions cannot apply.

Its own comparison with CoinPoker is a conflicted source for evaluating CoinPoker. This wiki uses CoinPoker’s own fee guide and terms for CoinPoker facts.

## Adjacent protocol research and exclusions

Insta-Pok3r is a 2024 research protocol describing committee-precomputed encrypted deck permutations with publicly verifiable private outputs. [18, lines 5-22] It belongs in the technical reading list, not a table of commercial rooms. Threshold and collusion assumptions require the full paper.

The reviewed PokerDAO domain returned a construction placeholder. [19, lines 1-8] That is not evidence of an operating poker service or proof of shutdown.

A secondary PokerFi listing describes a token-sale fee. [20, lines 696-704] A token fee and token listing do not establish an active poker room or its rake. PokerFi is excluded from the substantive comparison.

## Fee-comparison checklist

For each room or protocol, record:

- Cash rake percentage and cap, with stakes, game type, and player-count conditions.
- Whether rake applies before a flop, after a flop, to every hand, or to another eligible event.
- Tournament entry amount separately from its fee and the percentage denominator.
- Rakeback separately from gross charges, including eligibility.
- Operator deposit/withdrawal charges separately from blockchain gas.
- Approval, bridge, exchange spread, and token taxes where applicable.
- Subscription or service fees that a player must pay before joining.
- Withdrawal limits, compliance holds, and recovery paths.

A fair Private Poker comparison must include its complete cost stack. An unpublished rake schedule is not evidence of zero fees.

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
# Private Poker research wiki
Date: 2026-10-10  
POC: Project owner  
TL;DR: Seven poker products are compared for fees, privacy, and trust, with historical/prototype status and unverified marketing clearly separated. The intended differentiation is player-controlled dealing backed by inspectable verification and settlement evidence.

## Pages

| Page | Contents |
| --- | --- |
| [Competitor comparison](competitor-comparison.md) | Vara/Gear ZK Poker, Cardano zkPoker, zkHoldem, Virtue Poker, CoinPoker, Blockchain Poker, and PlayBlind; fee tables, custody/KYC qualifications, and current-status gaps. |
| [Privacy and trust](privacy-and-trust.md) | Card secrecy, shuffle integrity, verification, custody, public-chain metadata, and local claim boundaries. |
| [Product implications](product-positioning.md) | Positioning hypothesis, evidence priorities, complete fee stack, failure recovery, and validation tasks. |
| [Research plan](research-plan.md) | Questions, evidence strategy, scope, and deliverables. |

## Findings worth carrying forward

[CoinPoker's fee guide](https://coinpoker.com/rake/) supplies a concrete 5% cash-rake benchmark, caps, a separate heads-up schedule, and 2% to 8% tournament fees. [8, lines 254-304] Its [terms](https://coinpoker.com/wp-content/uploads/2026/03/Terms-and-Conditions-2026-CoinPoker-.pdf) permit identity/source-of-funds checks and withdrawal restrictions despite no-verification marketing. [11, lines 449-509]

[Vara ZK Poker](https://vara.network/ecosystem/zk-poker) describes a proof-backed private-card demo. [1, lines 6-12] [zkHoldem's project article](https://zkholdem.medium.com/introducing-zkholdem-decentralized-poker-room-as-a-reality-ee5a6a1476b) describes player-encrypted shuffling and dealing. [4, lines 76-105] Those design statements do not establish current production readiness or a complete player fee schedule.

[PlayBlind advertises](https://playblind.com/blog/coinpoker-vs-playblind) zero rake and server-blind cards. [14, lines 39-55] Its [fairness explanation](https://playblind.com/provably-fair-poker) does not supply the contracts or reproduction steps needed to verify those technical claims in this investigation. [15, lines 25-29]

Private Poker should explain what peers and contracts verify, what information becomes public, who can move funds, and how a stalled hand recovers. This is a recommendation, not a finding that the current app already satisfies each property.

## Method and limitations

Two delegated research passes covered primary project material, official fee pages, terms, and source gaps. A final review checked important fee/privacy qualifications. Sources were accessed on October 10, 2026; publication dates are retained when material is historical or a proposal.

Glasser's free catalog and endpoint inspection were checked. Paid Glasser search would duplicate the available research access, so no paid endpoint was run and no Glasser balance was spent.

This is desk research. No gambling accounts, live deposits, withdrawal tests, protocol audits, or liquidity measurements were performed. Several services have unresolved status or incomplete documentation. A failed page retrieval does not prove shutdown. Unknown fees are not zero fees.

## Local context

This wiki is stored in `private-poker-vite/docs/research` as requested. The project notes designate `private-poker` as the canonical frontend; documentation work here does not resume development of the held Vite frontend. No application or contract code was changed.

## Maintenance

Recheck fees, terms, deployment addresses, and service status before using a comparison externally. Keep vendor claims attributed. Treat hands-on testing, paid research, and deposits as separately authorized activities.

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
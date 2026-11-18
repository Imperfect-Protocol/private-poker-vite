import LegalPage from '@/components/legal/LegalPage';

const LIST = 'list-disc space-y-1 pl-5';

const CLAUSES = [
  {
    title: 'Scope',
    body: (
      <p>
        This notice covers the Private Poker demonstration and this website only.
      </p>
    ),
  },
  {
    title: 'What is processed',
    body: (
      <ul className={LIST}>
        <li>Your wallet address, and the public on-chain activity linked to it.</li>
        <li>The display name and profile you choose.</li>
        <li>Session keys derived in your browser from a wallet signature. The signature itself is not stored.</li>
        <li>Technical and connection details needed to load the app and connect you to other players.</li>
        <li>Messages you send us through the contact option.</li>
      </ul>
    ),
  },
  {
    title: 'What stays in your browser',
    body: (
      <p>
        The date of birth you enter at the age check is used only in the browser
        to confirm you are an adult. It is not sent to us and it is not stored.
        Wallet signing happens inside your wallet, not on a server.
      </p>
    ),
  },
  {
    title: 'Peer-to-peer connections',
    body: (
      <p>
        Players connect directly to each other. Your network address and
        connection details are shared with the players at your table as needed to
        connect, and some traffic may pass through relay infrastructure.
      </p>
    ),
  },
  {
    title: 'On-chain data',
    body: (
      <p>
        Accounts, tables and results are written to a public test blockchain.
        Anything written there is public and generally cannot be deleted or
        changed. Do not put personal information on-chain.
      </p>
    ),
  },
  {
    title: 'Why it is processed',
    body: (
      <p>
        To run the demonstration, connect players, keep tables fair, verify
        results and answer your messages.
      </p>
    ),
  },
  {
    title: 'Sharing',
    body: (
      <p>
        Infrastructure and relay providers are used to host and connect the app.
        Personal data is not sold and advertising trackers are not used.
      </p>
    ),
  },
  {
    title: 'Retention',
    body: (
      <p>
        Off-chain data is kept only as long as needed for the demonstration.
        On-chain data is controlled by the test network, not by the app.
      </p>
    ),
  },
  {
    title: 'Your choices',
    body: (
      <p>
        You can disconnect your wallet at any time. For questions, or to ask about
        off-chain data, use the contact option on the landing page.
      </p>
    ),
  },
  {
    title: 'Changes to this notice',
    body: (
      <p>
        This notice may be updated as the demonstration evolves. The date above
        shows the current version.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy notice"
      updated="18 November 2026"
      intro="A brief account of what this demonstration processes, what stays in your browser, and what is public on the test network."
      clauses={CLAUSES}
    />
  );
}

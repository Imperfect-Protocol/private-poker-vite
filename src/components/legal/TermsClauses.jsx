import { Link as RouterLink } from 'react-router-dom';

export const TERMS_CLAUSES = [
  {
    title: 'Private demonstration',
    body: (
      <p>
        Private Poker is a private technology demonstration. It is not available
        to the general public and it is not a commercial service. Access is
        limited to a small number of invited partners, collaborators, developers,
        testers and evaluators. Access can be limited, paused or withdrawn at any
        time.
      </p>
    ),
  },
  {
    title: 'Test network only',
    body: (
      <p>
        Everything runs on Arbitrum Sepolia, a public test network. Every chip,
        token and balance is a test asset with no monetary value. There is no real
        money involved, no deposits, no withdrawals, no prizes and no way to
        exchange anything here for money. Test networks can be reset or
        redeployed, so balances, tables and results may disappear.
      </p>
    ),
  },
  {
    title: 'Not a gambling service',
    body: (
      <p>
        Nothing here is an offer to gamble or a gambling product. Play is for
        demonstration, evaluation and technical discussion only. Do not use the
        app for real-money gambling or for anything that is illegal where you are.
      </p>
    ),
  },
  {
    title: 'Wallets and accounts',
    body: (
      <p>
        You sign in with your own wallet and remain responsible for it and its
        keys. Verification is manual and may require you to be an adult and in an
        eligible jurisdiction. Never share your keys or signing credentials.
      </p>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <p>
        Do not attack, overload, scrape or disrupt the service, interfere with
        other players, or use the demonstration to break the law. Access may be
        suspended if these terms are breached.
      </p>
    ),
  },
  {
    title: 'Availability and changes',
    body: (
      <p>
        The demonstration is a work in progress, provided as-is and as-available.
        There is no guarantee of uptime, correctness or continuity. Features,
        contracts and networks may change, break or be redeployed without notice.
      </p>
    ),
  },
  {
    title: 'No warranty',
    body: (
      <p>
        To the extent permitted by law, the app is provided without warranties and
        we are not liable for losses connected to using it, including lost test
        balances, missed play or changes to the test network. Nothing here
        excludes rights that cannot be excluded by law.
      </p>
    ),
  },
  {
    title: 'Privacy',
    body: (
      <p>
        What is processed, and what stays in your browser, is described in the
        {' '}
        <RouterLink to="/privacy" className="text-teal-300 transition-colors hover:text-teal-100">
          privacy notice
        </RouterLink>
        .
      </p>
    ),
  },
  {
    title: 'Contact',
    body: (
      <p>
        Questions about access or these terms? Use the contact option on the
        landing page.
      </p>
    ),
  },
  {
    title: 'Changes to these terms',
    body: (
      <p>
        These terms may be updated as the demonstration evolves. The date above
        shows the current version.
      </p>
    ),
  },
];

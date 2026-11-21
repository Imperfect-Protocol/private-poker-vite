import LegalPage from '@/components/legal/LegalPage';
import { TERMS_CLAUSES } from '@/components/legal/TermsClauses';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      updated="18 November 2026"
      intro="The short version: this is a private, invitation-only technology demonstration on a test network. Nothing here is real money or a gambling service."
      clauses={TERMS_CLAUSES}
    />
  );
}

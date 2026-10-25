"use client";

import { Check, CircleAlert, Coins, KeyRound, Lock, Pencil, PenLine, ShieldAlert, ShieldX, Wallet, Zap } from 'lucide-react';
import { ACCOUNT_STATUS, useAccounts } from '@/hooks/useAccounts';
import FlowStepDialog from '@/components/table_screen/dialogs/FlowStepDialog';
import Panel from '@/components/ui/Panel';

const STEPS = [
  { id: 'signin', label: 'Signature', hint: 'Prove you own the wallet' },
  { id: 'profile', label: 'Profile', hint: 'Choose a display name' },
  { id: 'status', label: 'Verification', hint: 'Account review' },
  { id: 'subscription', label: 'Subscription', hint: 'Pick a CHIPS allowance' },
];

const TRUST_POINTS = [
  { icon: Zap, text: 'Signing in is free. No gas, no transaction.' },
  { icon: KeyRound, text: 'Your session keys are derived from your signature.' },
  { icon: Coins, text: 'Hands settle on Arbitrum Sepolia.' },
];

const PRIMARY_BUTTON = 'mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-ember-500 px-6 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_12px_32px_-12px_rgba(255,165,0,0.8)] transition hover:bg-ember-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-wait disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none';

const CHIP = 'inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-slate-200';

function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function accountStatusNotice(status) {
  if (status === ACCOUNT_STATUS.SUSPENDED) return { tone: 'danger', title: 'Account suspended', body: 'Your account has been suspended.' };
  if (status === ACCOUNT_STATUS.BANNED) return { tone: 'danger', title: 'Account banned', body: 'Your account has been banned.' };
  if (status === ACCOUNT_STATUS.DELETED) return { tone: 'danger', title: 'Account deleted', body: 'Your account has been deleted.' };
  return { tone: 'pending', title: 'Verification pending', body: 'Your account needs to be verified. Send an email to', email: 'verify@contact.imperfectprotocol.ie' };
}

function StepList(props) {
  const currentIndex = STEPS.findIndex((step) => step.id === props.current);

  return (
    <ol className="grid gap-4">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const marker = isDone
          ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-200'
          : isCurrent
            ? 'border-teal-500 bg-teal-500/15 text-slate-50 shadow-[0_0_18px_rgba(255,56,92,0.45)]'
            : 'border-white/10 text-slate-500';

        return (
          <li key={step.id} className="flex items-center gap-4" aria-current={isCurrent ? 'step' : undefined}>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border font-mono text-xs font-bold ${marker}`}>
              {isDone ? <Check size={14} strokeWidth={3} /> : `0${index + 1}`}
            </span>
            <div>
              <div className={`text-sm font-bold uppercase tracking-[0.14em] ${isCurrent ? 'text-slate-50' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                {step.label}
              </div>
              <div className="text-xs text-slate-500">{step.hint}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepHeader(props) {
  const index = STEPS.findIndex((step) => step.id === props.step);

  return (
    <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-teal-500">
          Step {index + 1} of {STEPS.length}
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-50">{props.title}</h2>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-400">{props.description}</p>
      </div>
      {props.children}
    </div>
  );
}

function ErrorNotice(props) {
  if (!props.message) return null;

  return (
    <div role="alert" className="mt-5 flex gap-3 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-200">
      <CircleAlert size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
      {props.message}
    </div>
  );
}

function ProfileField(props) {
  const isInputDisabled = props.disabled || !props.editable;

  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        {props.disabled && <Lock size={11} aria-hidden="true" />}
        {props.label}
      </span>
      <input
        type={props.type ?? 'text'}
        value={props.disabled ? '' : props.value}
        placeholder={props.disabled ? 'Not collected yet' : undefined}
        disabled={isInputDisabled}
        onChange={(event) => props.onChange(props.field, event.target.value)}
        className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-600 focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/15 disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.02]"
      />
    </label>
  );
}

function TierOption(props) {
  return (
    <button
      type="button"
      onClick={() => props.onSelect(props.tier)}
      aria-pressed={props.selected}
      className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition md:p-5 ${props.selected
        ? 'border-ember-500/70 bg-ember-500/[0.07] shadow-[0_18px_40px_-22px_rgba(255,165,0,0.7)]'
        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'}`}
    >
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${props.selected ? 'border-ember-500 bg-ember-500 text-slate-950' : 'border-white/25'}`}>
        {props.selected && <Check size={12} strokeWidth={3.5} />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-black uppercase tracking-tight text-slate-50">{props.tier.name}</h3>
        <p className="mt-0.5 text-sm text-slate-400">{props.tier.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-lg font-black text-slate-50">
          {props.tier.monthlyPpdc} <span className="text-xs font-bold text-slate-400">PPDC/mo</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-200">
          <Coins size={12} className="text-cyan-400" aria-hidden="true" />
          {props.tier.chips.toLocaleString()} CHIPS
        </div>
      </div>
    </button>
  );
}

function SigninStep(props) {
  const accounts = props.accounts;

  return (
    <div>
      <StepHeader step="signin" title="Sign in" description="Your wallet signs a message to open a private session.">
        {accounts.accountSession?.walletAddress && (
          <span className={CHIP}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {formatAddress(accounts.accountSession.walletAddress)}
          </span>
        )}
      </StepHeader>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/60">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            <PenLine size={14} className="text-teal-500" aria-hidden="true" />
            Message to sign
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
            No gas
          </span>
        </div>
        <dl className="divide-y divide-white/[0.05] px-5 font-mono text-xs">
          <div className="grid grid-cols-[8.5rem_1fr] gap-4 py-3">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Domain</dt>
            <dd className="text-teal-300">{accounts.signinData.domain.name} v{accounts.signinData.domain.version}</dd>
          </div>
          <div className="grid grid-cols-[8.5rem_1fr] gap-4 py-3">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Type</dt>
            <dd className="break-all text-teal-300">{accounts.signinData.primaryType}</dd>
          </div>
          {accounts.signinFields.map((entry) => (
            <div key={entry.field} className="grid grid-cols-[8.5rem_1fr] gap-4 py-3">
              <dt className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{entry.field}</dt>
              <dd className="leading-5 text-slate-200">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ErrorNotice message={accounts.error} />

      <button type="button" onClick={accounts.handleSignin} disabled={accounts.isSigningIn} className={PRIMARY_BUTTON}>
        {accounts.isWalletConnected ? <PenLine size={16} aria-hidden="true" /> : <Wallet size={16} aria-hidden="true" />}
        {!accounts.isWalletConnected ? 'Connect wallet' : accounts.isSigningIn ? 'Waiting for signature...' : 'Sign in'}
      </button>
    </div>
  );
}

function ProfileStep(props) {
  const accounts = props.accounts;
  const isEditing = accounts.profileMode === 'edit';
  const isVerifiedSubscriptionProfile = accounts.accountStatus === ACCOUNT_STATUS.VERIFIED && !accounts.isSubscriptionActive;

  return (
    <div>
      <StepHeader step="profile" title="Profile" description="Your display name is public at the table.">
        {!isEditing && !isVerifiedSubscriptionProfile && (
          <button
            type="button"
            onClick={accounts.handleProfileEdit}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-200 transition hover:border-white/30 hover:bg-white/5"
          >
            <Pencil size={13} aria-hidden="true" />
            Edit
          </button>
        )}
      </StepHeader>

      <div className="mt-6">
        <ProfileField
          label="Display name"
          field="displayName"
          value={accounts.profile.displayName}
          editable={isEditing}
          onChange={accounts.handleProfileChange}
        />
      </div>

      <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          <Lock size={12} aria-hidden="true" />
          Private details
        </p>
        <p className="mt-1 text-xs text-slate-500">Contact and legal details are not stored in this version.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ProfileField label="Email address" field="email" type="email" value="" disabled onChange={accounts.handleProfileChange} />
          <ProfileField label="Phone number" field="phone" type="tel" value="" disabled onChange={accounts.handleProfileChange} />
          <div className="md:col-span-2">
            <ProfileField label="Legal name" field="legalName" value="" disabled onChange={accounts.handleProfileChange} />
          </div>
        </div>
      </div>

      <ErrorNotice message={accounts.error} />

      {isEditing ? (
        <button type="button" onClick={accounts.handleProfileSave} disabled={accounts.isSavingProfile} className={PRIMARY_BUTTON}>
          {accounts.isSavingProfile ? 'Saving...' : 'Continue'}
        </button>
      ) : (
        <button type="button" onClick={accounts.handleProfileContinue} className={PRIMARY_BUTTON}>
          Continue
        </button>
      )}
    </div>
  );
}

function StatusStep(props) {
  const notice = accountStatusNotice(props.status);
  const isDanger = notice.tone === 'danger';

  return (
    <div>
      <StepHeader step="status" title="Verification" description="New accounts are verified before they can subscribe." />
      <div className={`mt-6 flex gap-4 rounded-xl border p-5 ${isDanger ? 'border-red-500/30 bg-red-950/25' : 'border-cyan-400/20 bg-cyan-400/[0.05]'}`}>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${isDanger ? 'bg-red-500/15 text-red-300' : 'bg-cyan-400/15 text-cyan-200'}`}>
          {isDanger ? <ShieldX size={20} aria-hidden="true" /> : <ShieldAlert size={20} aria-hidden="true" />}
        </span>
        <div>
          <p className="font-bold text-slate-50">{notice.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            {notice.body}
            {notice.email && (
              <>
                {' '}
                <a href={`mailto:${notice.email}`} className="font-semibold text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 hover:decoration-cyan-200">
                  {notice.email}
                </a>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function SubscriptionStep(props) {
  const accounts = props.accounts;

  return (
    <div>
      <StepHeader step="subscription" title="Choose a tier" description="Your subscription funds a monthly CHIPS allowance.">
        {accounts.accountSession?.operator && (
          <span className={CHIP}>
            <span className="text-slate-500">Operator</span>
            {formatAddress(accounts.accountSession.operator)}
          </span>
        )}
      </StepHeader>

      <div className="mt-6 grid gap-3" role="group" aria-label="Subscription tiers">
        {accounts.subscriptionTiers.map((tier) => (
          <TierOption
            key={tier.id}
            tier={tier}
            selected={accounts.selectedTier.id === tier.id}
            onSelect={accounts.setSelectedTier}
          />
        ))}
      </div>

      <button type="button" onClick={accounts.handleContinue} disabled={accounts.isSubscribing} className={PRIMARY_BUTTON}>
        {accounts.isSubscribing ? accounts.subscriptionStep : `Subscribe to ${accounts.selectedTier.name}`}
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">CHIPS are credited once payment is confirmed.</p>

      <ErrorNotice message={accounts.error} />
    </div>
  );
}

function AccountStep(props) {
  if (props.accounts.step === 'signin') return <SigninStep accounts={props.accounts} />;
  if (props.accounts.step === 'status') return <StatusStep status={props.accounts.accountStatus} />;
  if (props.accounts.step === 'profile') return <ProfileStep accounts={props.accounts} />;
  return <SubscriptionStep accounts={props.accounts} />;
}

export default function AccountSignin() {
  const accounts = useAccounts();
  const operationDialogOkLabel = accounts.operationDialog?.error && !accounts.operationDialog?.isComplete
    ? 'Close'
    : 'Continue';

  return (
    <>
      <main className="px-4 py-10 md:px-10 lg:py-14">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950 p-8 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.8)] md:p-10">
            <img
              src="/splash.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-45 filter-[grayscale(0.1)_sepia(0.5)_hue-rotate(305deg)_saturate(1.55)_brightness(0.7)]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,5,6,0.35)_0%,rgba(9,5,6,0.85)_45%,#090506_100%)]" />

            <div className="relative z-10 flex h-full flex-col">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-teal-500">Account</p>
              <h1 className="mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-50 drop-shadow-[0_0_28px_rgba(225,29,72,0.35)] md:text-5xl">
                Welcome to Private Poker
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 md:text-base">
                Sign once to create your private session, then choose the tier that funds your monthly CHIPS.
              </p>

              <ul className="mt-8 grid gap-3">
                {TRUST_POINTS.map((point) => (
                  <li key={point.text} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-teal-500/25 bg-teal-500/10 text-teal-400">
                      <point.icon size={15} aria-hidden="true" />
                    </span>
                    {point.text}
                  </li>
                ))}
              </ul>

              <div className="mt-10 border-t border-white/[0.08] pt-8 lg:mt-auto">
                <StepList current={accounts.step} />
              </div>
            </div>
          </section>

          <Panel label="Account setup">
            {accounts.isCheckingAccount ? (
              <div className="flex h-full min-h-64 items-center justify-center gap-3 text-sm text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
                Checking your account...
              </div>
            ) : (
              <AccountStep accounts={accounts} />
            )}
          </Panel>
        </div>
      </main>
      {accounts.operationDialog && (
        <FlowStepDialog
          title={accounts.operationDialog.title}
          description={accounts.operationDialog.description}
          steps={accounts.operationDialog.steps}
          error={accounts.operationDialog.error}
          isComplete={accounts.operationDialog.isComplete}
          onOk={accounts.handleOperationDialogOk}
          okLabel={operationDialogOkLabel}
          canOkOnError
        />
      )}
    </>
  );
}

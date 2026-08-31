"use client";

import { useMemo, useState } from 'react';

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (year < 1900 || month < 1 || month > 12) {
    return null;
  }

  const birthDate = new Date(year, month - 1, day);
  const isValidDate = birthDate.getFullYear() === year
    && birthDate.getMonth() === month - 1
    && birthDate.getDate() === day;

  return isValidDate ? birthDate : null;
}

function checkAdult(dateOfBirth) {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!dateOfBirth || dateOfBirth > todayDate) {
    return null;
  }

  const adultCutoff = new Date(
    todayDate.getFullYear() - 18,
    todayDate.getMonth(),
    todayDate.getDate()
  );

  return dateOfBirth <= adultCutoff;
}

export default function AgeGateDialog({ isFading = false, onAdultConfirmed, onUnderage }) {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const maxDate = useMemo(() => formatDateInputValue(new Date()), []);

  function handleSubmit(event) {
    event.preventDefault();

    const ageResult = checkAdult(parseDateInputValue(dateOfBirth));

    if (ageResult === null) {
      setError('Enter a valid date of birth.');
      return;
    }

    if (!ageResult) {
      onUnderage();
      return;
    }

    onAdultConfirmed();
  }

  return (
    <form
      className={`relative z-20 w-[min(420px,calc(100%_-_2rem))] rounded-2xl border border-teal-400/30 bg-slate-950/90 p-6 text-center shadow-[0_0_60px_rgba(20,184,166,0.16)] backdrop-blur-md transition-all duration-700 ${isFading ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}
      onSubmit={handleSubmit}
    >
      <label htmlFor="age-gate-date" className="block text-sm font-bold text-slate-100">
        Enter your date of birth:
      </label>
      <input
        id="age-gate-date"
        type="date"
        min="1900-01-01"
        max={maxDate}
        value={dateOfBirth}
        onChange={(event) => {
          setDateOfBirth(event.target.value);
          setError('');
        }}
        className="mt-4 h-12 w-full rounded-lg border border-teal-500/30 bg-slate-900 px-4 font-mono text-sm font-bold text-teal-300 outline-none transition-colors focus:border-teal-300 focus:ring-2 focus:ring-teal-400/20"
      />
      {error ? (
        <p className="mt-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="mt-5 rounded-lg border border-teal-400/60 bg-teal-400/10 px-8 py-3 font-mono text-xs font-black uppercase tracking-[0.28em] text-teal-200 transition-colors hover:bg-teal-400/20 hover:text-white"
      >
        OK
      </button>
      <p className="mx-auto mt-4 max-w-xs text-[10px] font-medium leading-5 text-slate-500">
        This data won't be collected or stored in our systems.
      </p>
    </form>
  );
}

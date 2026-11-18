import { useEffect, useRef, useState } from 'react';

const COPY_FEEDBACK_MS = 1600;

export function useCopyFeedback() {
  const timerRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      setCopied(false);
    }
  };

  return { copied, copy };
}

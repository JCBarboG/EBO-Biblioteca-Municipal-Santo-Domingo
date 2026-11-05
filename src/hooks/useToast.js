import { useCallback, useRef, useState } from 'react';

const DEFAULT_DURATION = 2600;

export function useToast(duration = DEFAULT_DURATION) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((text) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(text);
    timerRef.current = setTimeout(() => setMessage(null), duration);
  }, [duration]);

  return { toastMessage: message, showToast };
}

import { useEffect } from 'react';

/**
 * Guest lock timer has been permanently removed so users and guests can browse
 * without any 1-minute or 5-minute popup lock.
 */
export default function GuestGate() {
  useEffect(() => {
    try {
      localStorage.removeItem('guest_started_at');
      localStorage.removeItem('guest_started_at_v4');
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}

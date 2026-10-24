/**
 * Global Frontend Information Patch Notification Bus (Requirement 2)
 * Allows any API call, Redux action, or UI component to trigger a rich
 * visual Information Patch (Success, Error, Warning, Not Found, or Info).
 */

const EVENT_NAME = 'movieshub:info-patch';

let counter = 1;

/**
 * Trigger a floating Information Patch on the frontend.
 * @param {Object} opts
 * @param {'success'|'error'|'warning'|'info'|'not-found'} [opts.type='info']
 * @param {string} [opts.title]
 * @param {string} opts.message
 * @param {number} [opts.duration=4200]
 */
export function notifyPatch(opts) {
  if (typeof window === 'undefined') return;
  const payload =
    typeof opts === 'string'
      ? { type: 'info', title: 'Status Update', message: opts, duration: 4000 }
      : {
          id: `patch-${Date.now()}-${counter++}`,
          type: opts?.type || 'info',
          title:
            opts?.title ||
            (opts?.type === 'success'
              ? 'Action Completed'
              : opts?.type === 'error'
                ? 'Action Failed'
                : opts?.type === 'not-found'
                  ? 'Not Found'
                  : opts?.type === 'warning'
                    ? 'Attention'
                    : 'Information'),
          message: opts?.message || '',
          duration: opts?.duration ?? 4200,
        };

  if (!payload.message) return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
}

export function subscribeInfoPatches(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => {
    if (e?.detail) callback(e.detail);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

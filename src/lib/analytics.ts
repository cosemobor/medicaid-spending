let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return sessionId;
}

export function trackEvent(eventType: string, eventData?: Record<string, unknown>) {
  try {
    const payload = {
      sessionId: getSessionId(),
      eventType,
      eventData: eventData ? JSON.stringify(eventData) : null,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp: new Date().toISOString(),
    };

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // silently fail
  }
}

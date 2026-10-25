/* @flow */

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function sameHost(req, value: string): boolean {
  try {
    const parsed = new URL(value);
    const requestHost = req.headers.host;
    const forwardedHost = req.headers['x-forwarded-host'];
    return parsed.host === requestHost || parsed.host === forwardedHost;
  } catch (error) {
    return false;
  }
}

// SameSite cookies provide the primary browser defense.  This origin check
// protects state-changing browser requests when a client sends Origin/Referer
// and does not require changing every existing API caller.
export default function csrfGuard(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin || req.headers.referer;
  if (origin && !sameHost(req, origin)) {
    res.status(403).json({
      errors: [{ msg: 'Cross-origin request rejected' }],
    });
    return;
  }
  next();
}

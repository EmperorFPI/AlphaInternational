/**
 * Alpha International — contact form relay.
 *
 * The site is otherwise static. This Worker exists for one reason: to keep the
 * HighLevel webhook URL out of the page source. The browser posts to
 * /api/contact on our own origin, and the URL lives in the HL_WEBHOOK_URL
 * secret, which never reaches the client.
 *
 * Everything else falls through to the static assets untouched.
 */

const ENDPOINT = '/api/contact';

// Only these keys are forwarded. Anything else a caller invents is dropped,
// so the relay cannot be used to push arbitrary payloads into the CRM.
const FIELDS = ['name', 'organisation', 'email', 'phone', 'enquiry_type', 'message'];
const REQUIRED = ['name', 'organisation', 'email', 'enquiry_type', 'message'];

const MAX_BODY_BYTES = 16 * 1024;
const MAX_FIELD_CHARS = 5000;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname !== ENDPOINT) {
      // Not ours — let the static assets answer.
      return env.ASSETS.fetch(request);
    }

    if (request.method !== 'POST') {
      return json(405, { error: 'Method not allowed' });
    }

    // Same-origin form only. This is not a security control — headers can be
    // forged — but it turns away drive-by cross-site posting cheaply.
    const origin = request.headers.get('Origin');
    if (origin && new URL(origin).host !== url.host) {
      return json(403, { error: 'Forbidden' });
    }

    if (!env.HL_WEBHOOK_URL) {
      // Misconfiguration, not the visitor's fault. Say so without detail.
      console.error('HL_WEBHOOK_URL is not set; contact form cannot deliver.');
      return json(503, { error: 'Contact form is not configured' });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json(413, { error: 'Too large' });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { error: 'Malformed request' });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json(400, { error: 'Malformed request' });
    }

    // Bots fill hidden inputs; people never see them. Accept and discard, so
    // whatever is behind it thinks it succeeded and moves on.
    if (typeof body.company_website === 'string' && body.company_website.trim() !== '') {
      return json(200, { ok: true });
    }

    const payload = {};
    for (const key of FIELDS) {
      const value = body[key];
      if (typeof value === 'string' && value.trim() !== '') {
        payload[key] = value.trim().slice(0, MAX_FIELD_CHARS);
      }
    }

    const missing = REQUIRED.filter((key) => !payload[key]);
    if (missing.length) {
      return json(400, { error: 'Missing required fields', fields: missing });
    }
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(payload.email)) {
      return json(400, { error: 'Invalid email address' });
    }

    // Stamped here rather than client-side so they cannot be spoofed.
    // Normalised so www and apex visitors do not look like two sources.
    payload.source = url.host.replace(/^www\./, '');
    payload.submitted_at = new Date().toISOString();

    let upstream;
    try {
      upstream = await fetch(env.HL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Webhook request failed:', err && err.message);
      return json(502, { error: 'Could not deliver the message' });
    }

    if (!upstream.ok) {
      // Log the status for debugging via `wrangler tail`, but never surface
      // the upstream response to the browser.
      console.error('Webhook returned', upstream.status);
      return json(502, { error: 'Could not deliver the message' });
    }

    return json(200, { ok: true });
  }
};

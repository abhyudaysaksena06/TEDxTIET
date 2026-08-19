// Supabase Edge Function: register
//
// All registration writes go through here instead of directly from the
// browser, so abuse controls can't be bypassed by editing client-side code.
//
// Defenses:
//  1. Per-IP rate limit (server-side, uses the real request IP — this can't
//     be spoofed from the browser the way a client-side counter could be).
//  2. Honeypot field — bots that fill every input get silently dropped.
//  3. Unique email constraint (enforced at the DB level).
//
// Limitation: IP rate limiting only stops abuse from a given network. It
// cannot stop someone deliberately cycling through many IPs/VPNs/proxies —
// no server-side check can fully solve that without a CAPTCHA, which was
// intentionally left out here. If distributed abuse becomes a real problem,
// the next practical step is adding Cloudflare Turnstile (free) at the
// verifyTurnstile() hook this file used to have.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MAX_REQUESTS_PER_IP = 3;
const WINDOW_MINUTES = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function getClientIp(req: Request): string {
  // Supabase's edge runtime sits behind a proxy that sets this reliably;
  // it's not something the client can spoof from the browser.
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') ?? 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    admissionNumber?: string;
    website?: string; // honeypot
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { name, email, phone, admissionNumber, website } = body;

  // Honeypot: real users never fill this hidden field. Pretend success so
  // bots don't learn their submission was rejected.
  if (website) {
    return json({ success: true });
  }

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !admissionNumber?.trim()) {
    return json({ error: 'Missing required fields' }, 400);
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400);
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    return json({ error: 'Invalid phone number' }, 400);
  }

  const ip = getClientIp(req);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Per-IP rate limit.
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', windowStart);

  if (countError) {
    return json({ error: 'Internal error' }, 500);
  }
  if ((count ?? 0) >= MAX_REQUESTS_PER_IP) {
    return json(
      { error: 'Too many registrations from this network. Please try again later.' },
      429
    );
  }

  const { error: insertError } = await supabase.from('registrations').insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    admission_number: admissionNumber.trim(),
    ip_address: ip,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return json({ error: 'This email has already been registered.' }, 409);
    }
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }

  return json({ success: true });
});

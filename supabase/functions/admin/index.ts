// Supabase Edge Function: admin
//
// The admin portal's only way in. The site's repo is public, so the login
// cannot live in the frontend: the credentials are checked here, against a
// salted hash in admin_users, and every read of the registrations needs a
// session token this function issued. The tables behind it have row level
// security on and no policies, so the public key can reach none of them.
//
// Actions, POSTed as { action }:
//   login   { username, password } -> { token, expiresAt }
//   list    x-admin-token header   -> { registrations }
//   logout  x-admin-token header

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SESSION_HOURS = 8;
const THROTTLE_MINUTES = 15;
const MAX_FAILURES_PER_IP = 5;
// IPs can be rotated, so failures are capped across all of them as well
const MAX_FAILURES_TOTAL = 30;
const PAGE_SIZE = 1000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') ?? 'unknown';
}

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/.{2}/g) ?? [], (b) => parseInt(b, 16));

async function pbkdf2(password: string, saltHex: string, iterations: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

function sameHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// hashed when the username is unknown too, so a wrong username takes as long
// as a wrong password and the response gives neither away
const DUMMY_SALT = '00'.repeat(16);
const DUMMY_ITERATIONS = 210000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { action?: string; username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (body.action === 'login') {
    const ip = getClientIp(req);
    const since = new Date(Date.now() - THROTTLE_MINUTES * 60 * 1000).toISOString();

    const [perIp, total] = await Promise.all([
      supabase
        .from('admin_login_failures')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', since),
      supabase
        .from('admin_login_failures')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since),
    ]);
    if (perIp.error || total.error) return json({ error: 'Internal error' }, 500);
    if ((perIp.count ?? 0) >= MAX_FAILURES_PER_IP || (total.count ?? 0) >= MAX_FAILURES_TOTAL) {
      return json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, 429);
    }

    const { data: user } = await supabase
      .from('admin_users')
      .select('password_hash, salt, iterations')
      .eq('username', body.username ?? '')
      .maybeSingle();

    const derived = await pbkdf2(
      body.password ?? '',
      user?.salt ?? DUMMY_SALT,
      user?.iterations ?? DUMMY_ITERATIONS
    );

    if (!user || !sameHex(derived, user.password_hash)) {
      await supabase.from('admin_login_failures').insert({ ip_address: ip });
      return json({ error: 'Incorrect username or password.' }, 401);
    }

    const now = new Date().toISOString();
    await Promise.all([
      supabase.from('admin_sessions').delete().lt('expires_at', now),
      supabase.from('admin_login_failures').delete().lt('created_at', since),
    ]);

    const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('admin_sessions')
      .insert({ token_hash: await sha256(token), expires_at: expiresAt });
    if (error) return json({ error: 'Internal error' }, 500);

    return json({ token, expiresAt });
  }

  // everything past here needs a live session
  const token = req.headers.get('x-admin-token');
  if (!token) return json({ error: 'Not signed in.' }, 401);
  const tokenHash = await sha256(token);

  if (body.action === 'logout') {
    await supabase.from('admin_sessions').delete().eq('token_hash', tokenHash);
    return json({ success: true });
  }

  const { data: session } = await supabase
    .from('admin_sessions')
    .select('token_hash')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (!session) return json({ error: 'Your session has ended. Sign in again.' }, 401);

  if (body.action === 'list') {
    const registrations: unknown[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, name, email, phone, roll_number, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) return json({ error: 'Internal error' }, 500);
      registrations.push(...data);
      if (data.length < PAGE_SIZE) break;
    }
    return json({ registrations });
  }

  return json({ error: 'Unknown action' }, 400);
});

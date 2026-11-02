import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, LoaderCircle, LogOut, RefreshCw, Search } from 'lucide-react';

/**
 * Admin portal: the registrations, behind a login.
 *
 * Nothing secret lives here. This repo is public, so the page only collects
 * the credentials and passes them to the "admin" Edge Function, which checks
 * them against a hash and hands back a session token; the registrations come
 * from that function and from nowhere else. Not linked from the site, and
 * kept out of search results.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const RED = '#eb0028';
const RULE = '#232323';
const MUTED = '#8a8a8a';
const TOKEN_KEY = 'tedxtiet-admin-token';

/** sessionStorage can throw in private windows; the portal works without it */
const stored = {
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* the session just won't survive a reload */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing was stored */
    }
  },
};

async function callAdmin(action, { token, ...fields } = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(token ? { 'x-admin-token': token } : {}),
    },
    body: JSON.stringify({ action, ...fields }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * A spreadsheet runs a cell starting with = + - or @ as a formula, and these
 * values were typed by the public, so a leading apostrophe keeps them as text.
 */
function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(rows) {
  const header = ['Name', 'Email', 'Phone', 'Roll Number', 'Registered (IST)'];
  const lines = rows.map((r) =>
    [r.name, r.email, r.phone, r.roll_number, formatDate(r.created_at)].map(csvCell).join(',')
  );
  const blob = new Blob([[header.map(csvCell).join(','), ...lines].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tedxtiet-registrations.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function Login({ onSignedIn, notice }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { ok, data } = await callAdmin('login', { username, password });
      if (ok && data.token) onSignedIn(data.token);
      else setError(data.error || 'Could not sign in. Try again.');
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full border bg-black px-3 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#eb0028]";

  return (
    <form onSubmit={submit} className="mx-auto mt-6 w-full max-w-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: MUTED }}>
        Organising team only
      </p>
      <p className="mt-3 font-['Anton'] text-4xl uppercase leading-none text-white">Sign in</p>

      {notice && (
        <p className="mt-5 font-mono text-xs" style={{ color: '#c9c7c2' }}>
          {notice}
        </p>
      )}

      <label className="mt-7 block font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
        Username
        <input
          type="text"
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={`${field} mt-2 normal-case tracking-normal`}
          style={{ borderColor: RULE }}
        />
      </label>

      <label className="mt-5 block font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
        Password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${field} mt-2 normal-case tracking-normal`}
          style={{ borderColor: RULE }}
        />
      </label>

      {error && (
        <p role="alert" className="mt-4 font-mono text-xs" style={{ color: '#ff3b52' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 px-4 py-3 font-['Anton'] text-sm uppercase tracking-[0.06em] text-white transition-opacity duration-300 hover:opacity-85 disabled:opacity-60"
        style={{ backgroundColor: RED }}
      >
        {busy && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
        {busy ? 'Signing in' : 'Sign in'}
      </button>
    </form>
  );
}

function Dashboard({ token, onSignedOut }) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { ok, status, data } = await callAdmin('list', { token });
      if (status === 401) {
        onSignedOut('Your session ended. Sign in again.');
        return;
      }
      if (ok) setRows(data.registrations);
      else setError(data.error || 'Could not load the registrations.');
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  }, [token, onSignedOut]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!rows) return [];
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.phone, r.roll_number].some((v) => v?.toLowerCase().includes(q))
    );
  }, [rows, query]);

  const signOut = async () => {
    try {
      await callAdmin('logout', { token });
    } finally {
      onSignedOut();
    }
  };

  const button =
    'inline-flex items-center gap-2 border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:border-[#eb0028] disabled:opacity-50';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: MUTED }}>
            Registrations
          </p>
          <p className="mt-2 font-['Anton'] text-5xl leading-none tabular-nums text-white">
            {rows ? rows.length : '–'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} disabled={loading} className={button} style={{ borderColor: RULE }}>
            <RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(visible)}
            disabled={!visible.length}
            className={button}
            style={{ borderColor: RULE }}
          >
            <Download aria-hidden="true" className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button type="button" onClick={signOut} className={button} style={{ borderColor: RULE }}>
            <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>

      <label className="relative mt-7 block">
        <span className="sr-only">Search registrations</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: MUTED }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone or roll number"
          className="w-full border bg-black py-3 pl-10 pr-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#eb0028]"
          style={{ borderColor: RULE }}
        />
      </label>

      {error && (
        <p role="alert" className="mt-4 font-mono text-xs" style={{ color: '#ff3b52' }}>
          {error}
        </p>
      )}

      {rows && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
          {query.trim() ? `${visible.length} of ${rows.length} shown` : 'Newest first'}
        </p>
      )}

      {rows && !rows.length && (
        <p className="mt-10 font-mono text-sm" style={{ color: '#c9c7c2' }}>
          No registrations yet. They appear here as people sign up.
        </p>
      )}

      {rows && rows.length > 0 && !visible.length && (
        <p className="mt-10 font-mono text-sm" style={{ color: '#c9c7c2' }}>
          Nothing matches that search.
        </p>
      )}

      {visible.length > 0 && (
        <div className="mt-3 overflow-x-auto border" style={{ borderColor: RULE }}>
          <table className="w-full min-w-[720px] border-collapse text-left font-mono text-xs text-white">
            <thead>
              <tr className="border-b uppercase tracking-[0.14em]" style={{ borderColor: RULE, color: MUTED }}>
                <th scope="col" className="px-3 py-3 font-normal">#</th>
                <th scope="col" className="px-3 py-3 font-normal">Name</th>
                <th scope="col" className="px-3 py-3 font-normal">Email</th>
                <th scope="col" className="px-3 py-3 font-normal">Phone</th>
                <th scope="col" className="px-3 py-3 font-normal">Roll number</th>
                <th scope="col" className="px-3 py-3 font-normal">Registered</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={r.id} className="border-b last:border-b-0" style={{ borderColor: RULE }}>
                  <td className="px-3 py-3 tabular-nums" style={{ color: MUTED }}>{i + 1}</td>
                  <td className="px-3 py-3">{r.name}</td>
                  <td className="break-all px-3 py-3">{r.email}</td>
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums">{r.phone}</td>
                  <td className="whitespace-nowrap px-3 py-3">{r.roll_number}</td>
                  <td className="whitespace-nowrap px-3 py-3" style={{ color: MUTED }}>{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => stored.get());
  const [notice, setNotice] = useState('');

  // keep the portal out of search results, for as long as it is on screen
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const signIn = useCallback((next) => {
    stored.set(next);
    setNotice('');
    setToken(next);
  }, []);

  const signOut = useCallback((message = '') => {
    stored.clear();
    setNotice(message);
    setToken(null);
  }, []);

  return (
    <div className="relative min-h-[60vh] bg-black text-white">
      <main className="relative mx-auto w-full max-w-[1200px] px-5 pb-24 md:px-10">
        <h1 className="sr-only">Admin</h1>
        {token ? (
          <Dashboard token={token} onSignedOut={signOut} />
        ) : (
          <Login onSignedIn={signIn} notice={notice} />
        )}
      </main>
    </div>
  );
}

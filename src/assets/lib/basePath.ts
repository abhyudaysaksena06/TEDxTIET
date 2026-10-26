/**
 * Where the site is mounted.
 *
 * One build serves two addresses: the root of tedxtiet-gamma.vercel.app, and
 * www.mrdev4u.com/tedxtiet, which the mrdev4u portfolio rewrites onto this
 * deployment. Vite emits relative asset paths (base "./"), so the bundle
 * itself loads from either; the router and the files in public/ need the
 * prefix, which is read once from the address the page was opened at.
 */
const MOUNT = "/tedxtiet";

const mounted =
    typeof window !== "undefined" &&
    (window.location.pathname === MOUNT || window.location.pathname.startsWith(MOUNT + "/"));

/** "/" at the root, "/tedxtiet/" when served under the portfolio */
export const BASE: string = mounted ? MOUNT + "/" : "/";

/** what React Router strips off the front of every route */
export const ROUTER_BASENAME: string = mounted ? MOUNT : "";

/** a file in public/, addressed correctly wherever the site is mounted */
export const asset = (path: string): string => BASE + path.replace(/^\//, "");

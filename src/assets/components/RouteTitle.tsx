import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Gives each page its own browser-tab title.
 *
 * Every route used to share the one title from index.html, so tabs, history
 * and bookmarks could not tell the pages apart. Names match the navigation's.
 */

const SITE = "TEDxTIET 2026";
const HOME_TITLE = `${SITE} — Ideas worth spreading, on stage`;

const TITLES: Record<string, string> = {
    "/gallery": "Gallery",
    "/team": "Team",
    "/speakers": "Speakers",
    "/sponsors": "Sponsors",
    "/alumni": "Alumni",
    "/event": "Events",
    "/contact": "Contact",
    "/register": "Register",
};

export default function RouteTitle() {
    const { pathname } = useLocation();

    useEffect(() => {
        const path = pathname.replace(/\/+$/, "") || "/";
        // /home and /stage-lab only redirect, so they pass through as home
        if (path === "/" || path === "/home" || path === "/stage-lab") {
            document.title = HOME_TITLE;
        } else {
            document.title = `${TITLES[path] ?? "Page not found"} — ${SITE}`;
        }
    }, [pathname]);

    return null;
}

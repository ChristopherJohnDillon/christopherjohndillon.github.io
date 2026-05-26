/* ============================================================
   FLARE — URL state module
   Single source of truth for filter state via the hash query string.
   Format: #/route?biz=trailcraft&channel=Amazon&period=mtd
   ============================================================ */
(function () {
  function parseHash() {
    const h = window.location.hash || "#/home";
    const qIdx = h.indexOf("?");
    if (qIdx === -1) return { route: h, params: {} };
    const route = h.slice(0, qIdx);
    const params = {};
    for (const [k, v] of new URLSearchParams(h.slice(qIdx + 1)).entries()) {
      params[k] = v;
    }
    return { route, params };
  }

  function buildHash(route, params) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === null || v === undefined || v === "" || v === "All") continue;
      usp.set(k, String(v));
    }
    const qs = usp.toString();
    return qs ? `${route}?${qs}` : route;
  }

  const listeners = new Set();

  /** Read all params currently in the URL. */
  function read() {
    return parseHash().params;
  }

  /** Read a single param with optional default. */
  function get(key, fallback) {
    const v = parseHash().params[key];
    return v === undefined ? fallback : v;
  }

  /** Merge/set params on the current route. Updates URL in place (no history entry). */
  function set(patch, opts = {}) {
    const { route, params } = parseHash();
    const next = { ...params, ...patch };
    // Strip keys whose value is null
    for (const k of Object.keys(patch)) {
      if (patch[k] === null) delete next[k];
    }
    const newHash = buildHash(route, next);
    if (newHash === (window.location.hash || "#/home")) return;
    // replaceState so back/forward only walks between routes, not between filter changes
    if (opts.push) {
      window.location.hash = newHash;
    } else {
      history.replaceState(null, "", newHash);
      // hashchange doesn't fire on replaceState — notify listeners manually
      listeners.forEach((fn) => { try { fn(next, route); } catch (_) {} });
    }
  }

  /** Build a link string for the given route + params (does not navigate). */
  function link(route, params) {
    return buildHash(route, params || {});
  }

  /** Subscribe to filter changes (fires on set() and on hashchange). */
  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  window.addEventListener("hashchange", () => {
    const { route, params } = parseHash();
    listeners.forEach((fn) => { try { fn(params, route); } catch (_) {} });
  });

  window.FlareUrl = { read, get, set, link, onChange, parseHash };
})();

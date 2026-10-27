// Minimal stand-in for the claude.ai dashboard runtime, so index.html runs as a
// plain static page. Provides the same `dash` API the page script uses:
// data, calc, onData, params, setParams, resetParams, setLink.
//
// Datasets are JSON files listed in DATASETS below. To add a source, drop a
// JSON array of row objects in data/ and add an entry here.
(() => {
  const DATASETS = {
    invoices: 'data/fintech_invoices.json',
    cashier_invoices: 'data/cashier_invoices.json',
  };

  const store = {};   // id -> {status, data, columns, message}
  const calcs = {};   // id -> {inputs, fn, title, description}
  const listeners = [];
  let params = {};

  const columnsOf = (rows) => (Array.isArray(rows) && rows.length ? Object.keys(rows[0]) : []);
  const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });

  Object.entries(DATASETS).forEach(([id, url]) => {
    store[id] = { status: 'loading', data: [], columns: [], meta: [] };
    fetch(url, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(url + ': HTTP ' + r.status); return r.json(); })
      .then((json) => {
        const rows = Array.isArray(json) ? json : json.rows || json.data || json.results || [];
        store[id] = { status: 'ok', data: rows, columns: columnsOf(rows), meta: [] };
      })
      .catch((e) => {
        console.error(e);
        store[id] = { status: 'error', data: [], columns: [], meta: [], message: String(e.message || e) };
      })
      .finally(notify);
  });

  function data(id) {
    if (store[id]) return { refreshing: false, ...store[id] };
    const c = calcs[id];
    if (!c) return { status: 'missing', data: [], columns: [], meta: [], refreshing: false };
    const ins = c.inputs.map(data);
    const bad = ins.find((d) => d.status !== 'ok');
    if (bad) return { status: bad.status, data: [], columns: [], meta: [], refreshing: false, message: bad.message };
    try {
      const out = c.fn(...ins.map((d) => d.data));
      return { status: 'ok', data: out, columns: columnsOf(out), meta: [], refreshing: false };
    } catch (e) {
      console.error('calc ' + id, e);
      return { status: 'error', data: [], columns: [], meta: [], refreshing: false, message: String(e.message || e) };
    }
  }

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(notify, 100); });

  window.dash = {
    data,
    calc(id, def) { calcs[id] = def; },
    loader() {},
    onData(fn) { listeners.push(fn); fn(); },
    params: () => ({ ...params }),
    setParams(p) {
      const next = { ...params };
      Object.entries(p).forEach(([k, v]) => { if (v == null) delete next[k]; else next[k] = v; });
      params = next;
      notify();
    },
    resetParams() { params = {}; notify(); },
    setLink(name) { history.replaceState(null, '', '#' + name); },
    refresh() {},
    colors: ['#2a78d6', '#e07a1f', '#2f9e6b', '#c2453a', '#7c5cc4', '#b8860b', '#1f9fb0', '#c24f8f'],
  };
})();

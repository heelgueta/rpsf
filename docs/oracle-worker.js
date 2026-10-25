/* runs the Oracle off the main thread so the UI stays smooth */
importScripts('engine.js', 'bots.js', 'oracle.js');
let oracle = RPSOracleCore.create();
onmessage = function (e) {
  const d = e.data;
  if (d.reset) { oracle.reset(); return; }
  try {
    const r = oracle.pick(d.state, { ms: d.ms });
    postMessage({ id: d.id, move: r.move, value: r.value });
  } catch (err) {
    postMessage({ id: d.id, error: String(err && err.message || err) });
  }
};

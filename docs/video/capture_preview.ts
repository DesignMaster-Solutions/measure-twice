const g = globalThis as any; const A = args as any;
if (g.__cap) { clearInterval(g.__cap.t); }
const dm = pluginSystem.findInterface(Editor.Dock.IDockManager) as any;
const w = dm.findPanel('Snap.Plugin.Gui.PreviewPanel').widget;
const st = { n: 0, t0: Date.now(), last: 0, dir: A.dir, max: A.max || 1500, t: null as any, stopAt: 0, err: '' };
st.t = setInterval(() => {
  try {
    if (st.n >= st.max || (st.stopAt && Date.now() > st.stopAt)) { clearInterval(st.t); return; }
    const pm = w.grab();
    pm.save(new Editor.Path(st.dir + '/' + String(st.n).padStart(4, '0') + '.jpg'), 92);
    st.n++; st.last = Date.now();
  } catch (e) { st.err = '' + e; }
}, A.ms || 100);
g.__cap = st;
return 'started';

// src/components/CausalTreeModal.jsx
// Arbre de causalité horizontal — drag & drop CUSTOM (mouse events)
// + sidebar multi-problèmes (pré-remplis depuis fe.defauts)

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:          "#f2f2f7",
  surface:     "#ffffff",
  surfaceAlt:  "#f5f5f7",
  border:      "rgba(0,0,0,0.09)",
  green:       "#30d158",
  orange:      "#ff9f0a",
  red:         "#ff3b30",
  blue:        "#0071e3",
  textPrimary: "#1d1d1f",
  textSecond:  "#6e6e73",
  textLight:   "#aeaeb2",
  font:        "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
  fontDisplay: "-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
  shadowModal: "0 40px 100px rgba(0,0,0,0.32),0 0 0 1px rgba(0,0,0,0.07)",
};

const CFG = {
  apparition: {
    label:    "Causes d'apparition",
    icon:     "🔴",
    color:    "#ff3b30",
    light:    "rgba(255,59,48,0.06)",
    lineColor:"rgba(255,59,48,0.30)",
    gradient: "linear-gradient(135deg,#ff3b30 0%,#ff6b60 100%)",
    badge:    "#ff3b30",
  },
  non_detection: {
    label:    "Causes de non-détection",
    icon:     "🟠",
    color:    "#ff9f0a",
    light:    "rgba(255,159,10,0.06)",
    lineColor:"rgba(255,159,10,0.38)",
    gradient: "linear-gradient(135deg,#ff9f0a 0%,#ffb740 100%)",
    badge:    "#ff9f0a",
  },
};

// ─── Arbre helpers ─────────────────────────────────────────────────────────────
let _id = 1000;
const nid = () => `n${++_id}`;

const mkNode = (text = "", parentId = null) => ({ id: nid(), text, parentId, children: [] });

function fromWhys(whys = []) {
  const root = mkNode(whys[0] || "", null);
  let cur = root;
  for (let i = 1; i < 5; i++) {
    if (!whys[i]) continue;
    const c = mkNode(whys[i], cur.id);
    cur.children = [c];
    cur = c;
  }
  if (!root.children.length) root.children = [mkNode("", root.id)];
  return root;
}

function toWhys(root) {
  const arr = [];
  let n = root;
  while (n && arr.length < 5) { arr.push(n.text); n = n.children[0] || null; }
  while (arr.length < 5) arr.push("");
  return arr;
}

function flatten(node, acc = []) {
  acc.push(node);
  (node.children || []).forEach(c => flatten(c, acc));
  return acc;
}

function clone(node) {
  return { ...node, children: (node.children || []).map(clone) };
}

function find(node, id) {
  if (node.id === id) return node;
  for (const c of node.children || []) { const f = find(c, id); if (f) return f; }
  return null;
}

function setText(root, id, text) {
  const r = clone(root);
  const n = find(r, id);
  if (n) n.text = text;
  return r;
}

function addChild(root, pid) {
  const r = clone(root);
  const p = find(r, pid);
  if (p) p.children.push(mkNode("", pid));
  return r;
}

function delNode(root, id) {
  const r = clone(root);
  function rm(n) { n.children = n.children.filter(c => c.id !== id).map(rm); return n; }
  return rm(r);
}

function moveNode(root, srcId, dstId) {
  if (srcId === dstId) return root;
  const src = find(root, srcId);
  if (!src) return root;
  if (find(src, dstId)) return root;
  let r = clone(root);
  let detached = null;
  function extract(n) {
    n.children = n.children.filter(c => { if (c.id === srcId) { detached = clone(c); return false; } return true; });
    n.children.forEach(extract);
    return n;
  }
  extract(r);
  if (!detached) return root;
  detached.parentId = dstId;
  function insert(n) { if (n.id === dstId) { n.children.push(detached); return; } n.children.forEach(insert); }
  insert(r);
  return r;
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const NW = 154, NH = 58, HGAP = 80, VGAP = 16, PAD = 32;

function layout(root) {
  function sh(n) {
    if (!n.children.length) return NH;
    return Math.max(NH, n.children.reduce((s, c) => s + sh(c), 0) + (n.children.length - 1) * VGAP);
  }
  const pos = {};
  function place(n, x, yTop) {
    const h = sh(n);
    pos[n.id] = { x: x + PAD, y: yTop + (h - NH) / 2 + PAD };
    let cy = yTop;
    for (const c of n.children) { const ch = sh(c); place(c, x + NW + HGAP, cy); cy += ch + VGAP; }
  }
  place(root, 0, 0);
  const xs = Object.values(pos).map(p => p.x);
  const ys = Object.values(pos).map(p => p.y);
  const W = (xs.length ? Math.max(...xs) : 0) + NW + PAD * 2;
  const H = (ys.length ? Math.max(...ys) : 0) + NH + PAD * 2;
  return { pos, W: Math.max(W, 700), H: Math.max(H, 300) };
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.ctn { font-family: ${T.font}; }
.ctn-node {
  position: absolute; border-radius: 10px;
  border: 1.5px solid rgba(0,0,0,0.10); background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07),0 0 0 0 transparent;
  box-sizing: border-box; transition: box-shadow .15s,border-color .15s; cursor: default;
}
.ctn-node.is-dragging { opacity:0; pointer-events:none; }
.ctn-node.is-drop-target { box-shadow:0 0 0 2.5px #0071e3,0 4px 16px rgba(0,113,227,0.18)!important; border-color:#0071e3!important; }
.ctn-node.is-root { font-weight:700; }
.ctn-lbl { font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.55px;padding:6px 10px 0;opacity:.55;pointer-events:none;font-family:${T.font}; }
.ctn-ta { font-family:${T.font};font-size:12.5px;color:${T.textPrimary};background:transparent;border:none;outline:none;width:100%;resize:none;line-height:1.45;padding:3px 10px 8px;box-sizing:border-box;cursor:text; }
.ctn-ta::placeholder { color:${T.textLight};font-style:italic; }
.ctn-btns { display:none;position:absolute;top:-11px;right:-11px;flex-direction:column;gap:4px;z-index:30; }
.ctn-node:hover .ctn-btns { display:flex; }
.ctn-btn { width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,0.9);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;line-height:1;box-shadow:0 2px 7px rgba(0,0,0,0.22);transition:transform .12s; }
.ctn-btn:hover { transform:scale(1.15); }
.ctn-btn-add { background:#0071e3;color:#fff; }
.ctn-btn-del { background:#ff3b30;color:#fff; }
.ctn-drag-handle { position:absolute;top:0;left:0;right:0;bottom:0;border-radius:10px;cursor:grab;z-index:1; }
.ctn-drag-handle:active { cursor:grabbing; }
.ctn-canvas { overflow:auto;flex:1;border-radius:12px;position:relative; }
.ctn-canvas::-webkit-scrollbar { width:5px;height:5px; }
.ctn-canvas::-webkit-scrollbar-track { background:transparent; }
.ctn-canvas::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.13);border-radius:3px; }
.ctn-tab { display:flex;align-items:center;gap:8px;padding:8px 18px;border-radius:10px 10px 0 0;border:1.5px solid rgba(0,0,0,0.08);border-bottom:none;background:${T.surfaceAlt};font-size:13px;font-weight:600;color:${T.textSecond};cursor:pointer;transition:all .15s;position:relative;bottom:-1px;font-family:${T.font}; }
.ctn-tab.active { background:#fff; }
.ghost-node { position:fixed;pointer-events:none;z-index:99999;opacity:0.82;border-radius:10px;background:#fff;border:2px solid #0071e3;box-shadow:0 8px 28px rgba(0,0,0,0.22);padding:6px 12px;font-family:${T.font};font-size:12.5px;color:${T.textPrimary};font-weight:600;min-width:100px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transform:translate(-50%,-50%) rotate(2deg); }
/* Sidebar problèmes */
.ct-prob-item { padding:10px 12px;border-radius:8px;margin-bottom:6px;cursor:pointer;border:1.5px solid rgba(0,0,0,0.09);background:#fff;transition:all .15s; }
.ct-prob-item:hover { border-color:#0071e3; }
.ct-prob-item.active { border-color:#0071e3;background:rgba(0,113,227,0.05); }
.ct-prob-scroll::-webkit-scrollbar { width:4px; }
.ct-prob-scroll::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12);border-radius:3px; }
.ct-add-prob-btn { width:100%;padding:8px;border:1.5px dashed rgba(0,0,0,0.09);border-radius:8px;background:transparent;color:${T.textLight};font-family:${T.font};font-size:12px;font-weight:500;cursor:pointer;transition:all .15s; }
.ct-add-prob-btn:hover { border-color:#0071e3;color:#0071e3; }
`;

function injectCSS() {
  if (document.getElementById("ctn-css")) return;
  const s = document.createElement("style");
  s.id = "ctn-css"; s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── Connecteurs SVG ──────────────────────────────────────────────────────────
function Lines({ root, pos, color }) {
  const paths = [];
  function walk(n) {
    const f = pos[n.id]; if (!f) return;
    for (const c of n.children || []) {
      const t = pos[c.id]; if (!t) continue;
      const x1 = f.x + NW, y1 = f.y + NH / 2;
      const x2 = t.x,      y2 = t.y + NH / 2;
      const mx = (x1 + x2) / 2;
      paths.push(<path key={`${n.id}-${c.id}`} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />);
      walk(c);
    }
  }
  walk(root);
  return <>{paths}</>;
}

// ─── Canvas avec drag custom ──────────────────────────────────────────────────
function Canvas({ root, cfg, onChange }) {
  const { pos, W, H } = layout(root);
  const nodes = flatten(root);
  const dragRef = useRef(null);
  const [draggingId,   setDraggingId]   = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const canvasRef = useRef(null);

  function createGhost(text, x, y) {
    const el = document.createElement("div");
    el.className = "ghost-node";
    el.textContent = text || "…";
    el.style.left = x + "px"; el.style.top = y + "px";
    document.body.appendChild(el);
    return el;
  }

  function nodeAtPoint(clientX, clientY, excludeId) {
    const canvas = canvasRef.current; if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cx = clientX - rect.left + canvas.scrollLeft;
    const cy = clientY - rect.top  + canvas.scrollTop;
    for (const n of nodes) {
      if (n.id === excludeId) continue;
      const p = pos[n.id]; if (!p) continue;
      if (cx >= p.x && cx <= p.x + NW && cy >= p.y && cy <= p.y + NH) return n.id;
    }
    return null;
  }

 

const onMouseDown = (e, nodeId, text) => {
  if (e.button !== 0) return;
  if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;
  
  e.preventDefault();
  const ghost = createGhost(text, e.clientX, e.clientY);
  dragRef.current = { nodeId, ghost, moved: false };

  function onMove(ev) {
    const d = dragRef.current;
    if (!d) return;
    d.moved = true;
    d.ghost.style.left = ev.clientX + "px";
    d.ghost.style.top = ev.clientY + "px";
    setDraggingId(d.nodeId);
    setDropTargetId(nodeAtPoint(ev.clientX, ev.clientY, d.nodeId));
  }

  function onUp(ev) {
    const d = dragRef.current;
    if (!d) return;
    d.ghost.remove();
    dragRef.current = null;
    
    if (d.moved) {
      const hit = nodeAtPoint(ev.clientX, ev.clientY, d.nodeId);
      if (hit) onChange(moveNode(root, d.nodeId, hit));
    }
    
    setDraggingId(null);
    setDropTargetId(null);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};
  return (
    <div ref={canvasRef} className="ctn-canvas" style={{ background: cfg.light, border: `1.5px solid ${cfg.color}22` }}>
      <div style={{ position: "relative", width: W, height: H }}>
        <svg style={{ position:"absolute",inset:0,width:W,height:H,pointerEvents:"none",overflow:"visible" }}>
          <Lines root={root} pos={pos} color={cfg.lineColor} />
        </svg>
        {nodes.map(n => {
          const p = pos[n.id]; if (!p) return null;
          return (
            <NodeBox key={n.id} node={n} p={p} cfg={cfg}
              isRoot={!n.parentId} isDrag={draggingId===n.id} isDrop={dropTargetId===n.id}
              onMouseDown={onMouseDown} onChange={onChange} root={root} />
          );
        })}
      </div>
    </div>
  );
}

// ─── Nœud individuel ─────────────────────────────────────────────────────────
function NodeBox({ node, p, cfg, isRoot, isDrag, isDrop, onMouseDown, onChange, root }) {
  const taRef = useRef(null);
  const autoH = () => { const ta = taRef.current; if (!ta) return; ta.style.height="auto"; ta.style.height=Math.max(30,ta.scrollHeight)+"px"; };
  useEffect(() => { autoH(); }, [node.text]);
  return (
    <div
      className={`ctn-node${isRoot?" is-root":""}${isDrag?" is-dragging":""}${isDrop?" is-drop-target":""}`}
      style={{ left:p.x,top:p.y,width:NW,minHeight:NH, borderColor:node.text?`${cfg.color}77`:"rgba(0,0,0,0.09)", background:isRoot?`${cfg.color}11`:node.text?`${cfg.color}08`:"#fff" }}
    >
      {!isRoot && <div className="ctn-drag-handle" onMouseDown={e=>onMouseDown(e,node.id,node.text)} title="Glisser pour déplacer" />}
      <div className="ctn-lbl" style={{ color:cfg.color,position:"relative",zIndex:2 }}>{isRoot?"PROBLÈME":"CAUSE"}</div>
      <textarea ref={taRef} className="ctn-ta" style={{ position:"relative",zIndex:2 }}
        value={node.text} rows={1}
        onChange={e=>{ onChange(setText(root,node.id,e.target.value)); autoH(); }}
        onMouseDown={e=>e.stopPropagation()}
        placeholder={isRoot?"Décrire le problème…":"Pourquoi ?"}
      />
      <div className="ctn-btns" style={{ zIndex:10 }}>
        <button className="ctn-btn ctn-btn-add" title="Ajouter une sous-cause"
          onMouseDown={e=>e.stopPropagation()} onClick={e=>{ e.stopPropagation(); onChange(addChild(root,node.id)); }}>+</button>
        {!isRoot && (
          <button className="ctn-btn ctn-btn-del" title="Supprimer ce nœud"
            onMouseDown={e=>e.stopPropagation()} onClick={e=>{ e.stopPropagation(); onChange(delNode(root,node.id)); }}>✕</button>
        )}
      </div>
    </div>
  );
}

// ─── Mini progress bar pour la sidebar ───────────────────────────────────────
function MiniProgress({ filled, total = 5, color }) {
  const c = filled === total ? T.green : filled > 0 ? T.orange : "rgba(0,0,0,0.09)";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:4 }}>
      <div style={{ flex:1,height:3,borderRadius:2,background:"rgba(0,0,0,0.07)",overflow:"hidden" }}>
        <div style={{ width:`${Math.round(filled/total*100)}%`,height:"100%",background:c,transition:"width .3s" }} />
      </div>
      <span style={{ fontSize:9,fontWeight:700,color:c,minWidth:18 }}>{filled}/{total}</span>
    </div>
  );
}

// ─── Helpers pour compter les nœuds remplis ───────────────────────────────────
function countFilled(trees, key) {
  return trees?.[key] ? flatten(trees[key]).filter(n => n.text.trim()).length : 0;
}

// ─── Crée un problème vide ────────────────────────────────────────────────────
let _pid = 0;
function newProbleme(desc = "", whysApp = [], whysNonDet = [], racine = "") {
  return {
    id: `prob_${++_pid}_${Date.now()}`,
    description: desc,
    trees: {
      apparition:    fromWhys(whysApp),
      non_detection: fromWhys(whysNonDet),
    },
    racine,
  };
}

// ─── Modale principale ────────────────────────────────────────────────────────
export default function CausalTreeModal({
  open,
  whyApparition   = ["","","","",""],
  whyNonDetection = ["","","","",""],
  causeRacine     = "",
  problemes: problemesProp = [],
  fe,
  onSave,
  onCancel,
}) {
  const [tab,       setTab]       = useState("apparition");
  const [problemes, setProblemes] = useState([]);
  const [activeId,  setActiveId]  = useState(null);

  useEffect(() => { injectCSS(); }, []);

  // ── Init à l'ouverture ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTab("apparition");

    let initial = [];

    if (problemesProp && problemesProp.length > 0) {
      // Reprendre les problèmes déjà sauvegardés
      initial = problemesProp.map((p) => ({
        id: p.id || `prob_${++_pid}_${Date.now()}`,
        description: p.description || "",
        trees: {
          apparition:    p.trees?.apparition    ? clone(p.trees.apparition)    : fromWhys(p.why_apparition    || []),
          non_detection: p.trees?.non_detection ? clone(p.trees.non_detection) : fromWhys(p.why_non_detection || []),
        },
        racine: p.racine || p.cause_racine || "",
      }));
    } else if (fe?.defauts && fe.defauts.length > 0) {
      // Un problème par défaut de la FE
      initial = fe.defauts.map((d, i) => newProbleme(
        d.defaut || `Défaut ${i + 1}`,
        i === 0 ? whyApparition   : [],
        i === 0 ? whyNonDetection : [],
        i === 0 ? causeRacine     : "",
      ));
    } else {
      // Fallback : un seul problème avec les données legacy
      initial = [newProbleme(
        fe?.designation || "Problème principal",
        whyApparition,
        whyNonDetection,
        causeRacine,
      )];
    }

    setProblemes(initial);
    setActiveId(initial[0]?.id ?? null);
  }, [open]);

  if (!open) return null;

  const active = problemes.find(p => p.id === activeId) || null;
  const cfg    = CFG[tab];

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateActive = (patch) =>
    setProblemes(prev => prev.map(p => p.id === activeId ? { ...p, ...patch } : p));

  const setTree = (key, root) =>
    updateActive({ trees: { ...active.trees, [key]: root } });

  const addProblem = () => {
    const np = newProbleme("");
    setProblemes(prev => [...prev, np]);
    setActiveId(np.id);
  };

  const removeProblem = (id) => {
    if (problemes.length <= 1) return;
    const rest = problemes.filter(p => p.id !== id);
    setProblemes(rest);
    if (activeId === id) setActiveId(rest[0]?.id ?? null);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = () => {
    const first = problemes[0] || {};
    onSave({
      // rétro-compat : le 1er problème remonte dans les champs legacy
      why_apparition:          toWhys(first.trees?.apparition),
      why_non_detection:       toWhys(first.trees?.non_detection),
      cause_racine_apparition: first.racine || "",
      // nouveau : tous les problèmes
      problemes: problemes.map(p => ({
        id:                p.id,
        description:       p.description,
        why_apparition:    toWhys(p.trees?.apparition),
        why_non_detection: toWhys(p.trees?.non_detection),
        cause_racine:      p.racine || "",
        trees:             p.trees,
      })),
    });
  };

  // ── Compteurs sidebar ───────────────────────────────────────────────────────
  const nbComplets = problemes.filter(p =>
    countFilled(p.trees, "apparition") > 0 && countFilled(p.trees, "non_detection") > 0
  ).length;

  return (
    <div className="ctn" style={{
      position:"fixed",inset:0,zIndex:10999,
      background:"rgba(0,0,0,0.65)",
      backdropFilter:"blur(16px) saturate(180%)",
      WebkitBackdropFilter:"blur(16px) saturate(180%)",
      display:"flex",alignItems:"center",justifyContent:"center",
    }} onMouseDown={onCancel}>
      <div style={{
        width:"97vw", maxWidth:1520, height:"94vh",
        borderRadius:22, background:T.bg,
        boxShadow:T.shadowModal,
        display:"flex", flexDirection:"column",
        overflow:"hidden",
      }} onMouseDown={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ padding:"16px 24px 0", background:"rgba(255,255,255,0.98)", borderBottom:`1px solid rgba(0,0,0,0.08)`, flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16 }}>
            <div style={{ width:48,height:48,borderRadius:14,flexShrink:0,background:cfg.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:`0 6px 18px ${cfg.color}44`,transition:"background .3s" }}>🌳</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:T.fontDisplay,fontWeight:800,fontSize:19,color:T.textPrimary,letterSpacing:"-.3px" }}>
                Arbre de causalité — D5
              </div>
              <div style={{ fontSize:12,color:T.textSecond,marginTop:2,display:"flex",gap:14 }}>
                <span><span style={{ background:"#0071e3",color:"#fff",borderRadius:"50%",width:14,height:14,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,marginRight:5 }}>+</span>Ajouter une sous-cause</span>
                <span>·</span>
                <span>🖱 Glisser un nœud pour déplacer</span>
                <span>·</span>
                <span><span style={{ color:"#ff3b30",fontWeight:700 }}>✕</span> Supprimer</span>
              </div>
            </div>

            {/* Compteurs causes du problème actif */}
            {active && (
              <div style={{ display:"flex",gap:8 }}>
                {(["apparition","non_detection"]).map(k => {
                  const c = CFG[k]; const n = countFilled(active.trees, k);
                  return (
                    <div key={k} style={{ padding:"5px 14px",borderRadius:20, background:n>0?`${c.color}14`:T.surfaceAlt, border:`1.5px solid ${n>0?c.color+"44":"rgba(0,0,0,0.08)"}`, fontSize:12.5,fontWeight:600, color:n>0?c.color:T.textLight, display:"flex",alignItems:"center",gap:6,transition:"all .2s",fontFamily:T.font }}>
                      {c.icon} {n} cause{n>1?"s":""}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Complétude globale */}
            <div style={{ padding:"5px 14px",borderRadius:20,background:T.surfaceAlt,border:"1.5px solid rgba(0,0,0,0.08)",fontSize:12,fontWeight:600,color:nbComplets===problemes.length&&problemes.length>0?T.green:T.textSecond,display:"flex",alignItems:"center",gap:6,fontFamily:T.font }}>
              {nbComplets}/{problemes.length} problème{problemes.length>1?"s":""} ✓
            </div>

            <button onClick={onCancel} style={{ width:34,height:34,borderRadius:"50%",flexShrink:0,background:"rgba(0,0,0,0.06)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.textSecond,transition:"background .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.12)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.06)"}>✕</button>
          </div>

          {/* Tabs apparition / non-détection */}
          <div style={{ display:"flex",gap:4,borderBottom:`1px solid rgba(0,0,0,0.08)` }}>
            {[{ k:"apparition",l:"Causes d'apparition" },{ k:"non_detection",l:"Causes de non-détection" }].map(({ k, l }) => {
              const c = CFG[k]; const isActive = tab===k; const n = active ? countFilled(active.trees, k) : 0;
              return (
                <button key={k} className={`ctn-tab${isActive?" active":""}`}
                  style={{ borderColor:isActive?`${c.color}55`:"rgba(0,0,0,0.08)", color:isActive?c.color:T.textSecond, background:isActive?"#fff":T.surfaceAlt }}
                  onClick={() => setTab(k)}>
                  {c.icon} {l}
                  {n > 0 && <span style={{ background:c.badge,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 8px",marginLeft:4 }}>{n}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Corps : sidebar + canvas ────────────────────────────── */}
        <div style={{ flex:1,display:"flex",overflow:"hidden",minHeight:0 }}>

          {/* ── SIDEBAR problèmes ─────────────────────────────────── */}
          <div style={{ width:240,flexShrink:0,borderRight:`1px solid rgba(0,0,0,0.08)`,background:"rgba(255,255,255,0.95)",display:"flex",flexDirection:"column",overflow:"hidden" }}>
            <div style={{ padding:"10px 12px 8px",borderBottom:`1px solid rgba(0,0,0,0.07)` }}>
              <div style={{ fontSize:10,fontWeight:800,color:T.textLight,textTransform:"uppercase",letterSpacing:".5px" }}>
                Problèmes ({problemes.length})
              </div>
              {fe?.numero_fe && <div style={{ fontSize:11,color:T.textSecond,marginTop:2 }}>FE {fe.numero_fe}</div>}
            </div>

            <div className="ct-prob-scroll" style={{ flex:1,overflowY:"auto",padding:"8px" }}>
              {problemes.map((p, i) => {
                const fA  = countFilled(p.trees, "apparition");
                const fND = countFilled(p.trees, "non_detection");
                const done    = fA > 0 && fND > 0;
                const partial = (fA > 0 || fND > 0) && !done;
                const isAct   = p.id === activeId;
                return (
                  <div key={p.id} className={`ct-prob-item${isAct?" active":""}`} onClick={() => setActiveId(p.id)}>
                    <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:6 }}>
                      {/* Numéro */}
                      <div style={{ width:22,height:22,borderRadius:6,flexShrink:0,background:isAct?T.blue:T.surfaceAlt,border:`1.5px solid ${isAct?T.blue:"rgba(0,0,0,0.09)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.fontDisplay,fontWeight:800,fontSize:11,color:isAct?"#fff":T.textSecond }}>
                        {i+1}
                      </div>
                      {/* Label */}
                      <span style={{ flex:1,fontSize:12,fontWeight:600,color:T.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                        {p.description || `Problème ${i+1}`}
                      </span>
                      {/* Statut */}
                      {done    && <span style={{ fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:6,background:"#e8fdf0",color:"#1a7a3f",border:`1px solid ${T.green}`,flexShrink:0 }}>✓</span>}
                      {partial && <span style={{ fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:6,background:"#fff8ed",color:"#b45309",border:`1px solid ${T.orange}`,flexShrink:0 }}>…</span>}
                      {/* Supprimer */}
                      {problemes.length > 1 && (
                        <button onClick={e=>{ e.stopPropagation(); removeProblem(p.id); }}
                          style={{ background:"none",border:"none",cursor:"pointer",color:T.textLight,fontSize:15,padding:"0 2px",lineHeight:1,flexShrink:0 }}
                          title="Supprimer">×</button>
                      )}
                    </div>
                    {/* Mini progress */}
                    <div style={{ paddingLeft:29,display:"flex",flexDirection:"column",gap:4 }}>
                      <div>
                        <div style={{ fontSize:8.5,color:T.red,fontWeight:700,marginBottom:2 }}>Apparition</div>
                        <MiniProgress filled={fA} color={T.red} />
                      </div>
                      <div>
                        <div style={{ fontSize:8.5,color:T.orange,fontWeight:700,marginBottom:2 }}>Non-détection</div>
                        <MiniProgress filled={fND} color={T.orange} />
                      </div>
                      {p.racine && (
                        <div style={{ fontSize:10,color:"#1a7a3f",background:"#e8fdf0",borderRadius:5,padding:"3px 6px",border:`1px solid ${T.green}`,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2 }}>
                          🎯 {p.racine}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding:"8px" }}>
              <button className="ct-add-prob-btn" onClick={addProblem}>＋ Ajouter un problème</button>
            </div>
          </div>

          {/* ── CANVAS (mise en page originale intacte) ────────────── */}
          <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"16px 20px 0",gap:0,overflow:"hidden",minHeight:0 }}>
            {active?.trees?.[tab] ? (
              <Canvas
                key={`${activeId}-${tab}`}
                root={active.trees[tab]}
                cfg={cfg}
                onChange={root => setTree(tab, root)}
              />
            ) : (
              <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.textLight,fontSize:14 }}>
                Sélectionnez un problème dans la liste
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div style={{ padding:"14px 22px",borderTop:`1px solid rgba(0,0,0,0.07)`,background:"rgba(255,255,255,0.98)",flexShrink:0,display:"flex",gap:16,alignItems:"flex-end" }}>
          {tab === "apparition" && active ? (
            <div style={{ flex:1 }}>
              <div style={{ fontSize:9.5,fontWeight:800,color:T.textLight,textTransform:"uppercase",letterSpacing:".55px",marginBottom:5,fontFamily:T.font }}>✅ Cause racine — conclusion</div>
              <textarea
                style={{ fontFamily:T.font,fontSize:13,color:T.textPrimary,background:"#f0fdf4",border:`1.5px solid ${T.green}`,borderRadius:9,padding:"9px 13px",width:"100%",boxSizing:"border-box",outline:"none",resize:"none",lineHeight:1.5,minHeight:44,transition:"border-color .15s" }}
                value={active.racine}
                onChange={e => updateActive({ racine: e.target.value })}
                placeholder="Synthèse : quelle est la cause racine identifiée ?"
                rows={1}
                onFocus={e  => e.currentTarget.style.borderColor=T.green}
                onBlur={e   => e.currentTarget.style.borderColor=T.green}
              />
            </div>
          ) : <div style={{ flex:1 }} />}

          <div style={{ display:"flex",gap:10,flexShrink:0 }}>
            <button onClick={onCancel} style={{ fontFamily:T.font,fontSize:13,fontWeight:500,padding:"10px 22px",borderRadius:10,border:`1.5px solid rgba(0,0,0,0.10)`,background:"#fff",color:T.textPrimary,cursor:"pointer",transition:"background .12s" }}
              onMouseEnter={e=>e.currentTarget.style.background=T.surfaceAlt}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>Annuler</button>
            <button onClick={save} style={{ fontFamily:T.font,fontSize:13,fontWeight:700,padding:"10px 30px",borderRadius:10,border:"none",cursor:"pointer",background:cfg.gradient,color:"#fff",boxShadow:`0 4px 16px ${cfg.color}55`,transition:"box-shadow .15s,transform .12s" }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 8px 24px ${cfg.color}66`; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow=`0 4px 16px ${cfg.color}55`; e.currentTarget.style.transform="none"; }}>
              💾 Valider l'analyse
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
// src/components/AuraWrapped.jsx
// Aura Wrapped — Resumen mensual cinematográfico estilo Banorte
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchTransactions } from "../services/transactionsService";
import { fetchInversiones }  from "../services/inversionesService";
import { X, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import banorteLogo from "../assets/banorte-logo.png";
 
const API_URL = "http://localhost:3000";
 
// ─── Constantes ───────────────────────────────────────────────────────────────
const MESES   = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS    = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const CAT_EMO = { Comida:"🍔", Transporte:"🚗", Entretenimiento:"🎬", Servicios:"⚡", Salud:"💊", Compras:"🛍️", Viajes:"✈️", Educación:"📚", Otros:"💳" };
 
const fmt  = (n) => Number(n).toLocaleString("es-MX", { style:"currency", currency:"MXN", maximumFractionDigits:0 });
const fmtD = (n) => Number(n).toLocaleString("es-MX", { style:"currency", currency:"MXN" });
 
// ─── Calcular datos del mes ───────────────────────────────────────────────────
function calcular(txs, inversiones) {
  const ahora   = new Date();
  const egresos = txs.filter(t => t.type === "egreso");
  const ing     = txs.filter(t => t.type === "ingreso");
 
  const totalE = egresos.reduce((s,t) => s + parseFloat(t.amount||0), 0);
  const totalI = ing.reduce((s,t)     => s + parseFloat(t.amount||0), 0);
  const balance = totalI - totalE;
 
  // Por categoría
  const porCat = {};
  egresos.forEach(t => {
    const c = t.category || "Otros";
    porCat[c] = (porCat[c]||0) + parseFloat(t.amount||0);
  });
  const cats = Object.entries(porCat)
    .map(([n,v]) => ({ nombre:n, total:v, pct: totalE>0 ? Math.round(v/totalE*100) : 0 }))
    .sort((a,b) => b.total-a.total);
 
  // Día de más gasto
  const porDia = {};
  egresos.forEach(t => {
    const d = new Date(t.date);
    if (!isNaN(d)) { const n = DIAS[d.getDay()]; porDia[n]=(porDia[n]||0)+1; }
  });
  const diaTop = Object.entries(porDia).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "—";
 
  const txMax = [...egresos].sort((a,b)=>parseFloat(b.amount)-parseFloat(a.amount))[0] ?? null;
 
  const hoy  = new Date();
  const en30 = new Date(); en30.setDate(en30.getDate()+30);
  const activas = inversiones.filter(i => new Date(i.fecha_fin) > hoy);
 
  return {
    mes: MESES[ahora.getMonth()],
    mesNum: ahora.getMonth()+1,
    anio: ahora.getFullYear(),
    totalE, totalI, balance,
    numTx: txs.length,
    numE: egresos.length,
    numI: ing.length,
    cats,
    catTop: cats[0] ?? null,
    diaTop, txMax,
    invActivas: activas.length,
    totalInv: activas.reduce((s,i)=>s+parseFloat(i.valor||0),0),
    porVencer: activas.filter(i=>new Date(i.fecha_fin)<=en30).length,
    ahorroPct: totalI > 0 ? Math.max(0, Math.round(balance/totalI*100)) : 0,
    vacio: txs.length === 0,
  };
}
 
// ─── Análisis Ollama ──────────────────────────────────────────────────────────
async function pediria(d) {
  if (d.vacio) throw new Error("sin datos");
  const top = d.cats.slice(0,3).map(c=>`${c.nombre} $${c.total.toFixed(0)}`).join(", ");
  const prompt = `Eres Aura, asistente financiero de Banorte. Analiza ${d.mes} ${d.anio}.
Ingresos:$${d.totalI.toFixed(0)} Egresos:$${d.totalE.toFixed(0)} Balance:$${d.balance.toFixed(0)} Ahorro:${d.ahorroPct}% Top:${top} DíaPeak:${d.diaTop}
Responde SOLO JSON sin markdown:
{"frase":"frase poderosa máx 8 palabras","logro":"logro concreto máx 10 palabras","consejo":"consejo accionable máx 12 palabras","perfil":"perfil 2 palabras"}`;
 
  const res = await fetch(`${API_URL}/api/ia/agentic`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages:[{role:"user",content:prompt}] }),
  });
  if (!res.ok) throw new Error("error");
 
  const reader = res.body.getReader();
  const dec    = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    dec.decode(value,{stream:true}).split("\n").filter(Boolean).forEach(l => {
      try { const j=JSON.parse(l); if(j.message?.content) acc+=j.message.content; } catch{}
    });
  }
  const m = acc.match(/\{[\s\S]*?\}/);
  if (!m) throw new Error("no json");
  return JSON.parse(m[0]);
}
 
// ─── Componente: número animado (count-up) ────────────────────────────────────
function CountUp({ value, prefix="", suffix="", duration=1200, decimals=0 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
 
  useEffect(() => {
    const start = performance.now();
    const from  = 0;
    const to    = parseFloat(value) || 0;
 
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(from + (to - from) * ease);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
 
  const formatted = decimals > 0
    ? display.toLocaleString("es-MX", { minimumFractionDigits:decimals, maximumFractionDigits:decimals })
    : Math.round(display).toLocaleString("es-MX");
 
  return <>{prefix}{formatted}{suffix}</>;
}
 
// ─── Barra animada ────────────────────────────────────────────────────────────
function Bar({ pct, color, delay=0, height=7 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);
 
  return (
    <div style={{ height, background:"rgba(255,255,255,0.12)", borderRadius:999, overflow:"hidden" }}>
      <div style={{
        height:"100%", width:`${width}%`, background:color,
        borderRadius:999, transition:"width 0.9s cubic-bezier(0.25,0.46,0.45,0.94)",
      }}/>
    </div>
  );
}
 
// ─── Logo + etiqueta superior de cada slide ───────────────────────────────────
function SlideTop({ label, dark=false }) {
  const inv = !dark; // Si fondo oscuro → logo blanco
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"16px 22px 0", flexShrink:0,
    }}>
      <img
        src={banorteLogo}
        alt="Banorte"
        style={{ height:19, filter: inv ? "brightness(0) invert(1)" : "none" }}
      />
      {label && (
        <span style={{
          fontFamily:'"Gotham",sans-serif', fontSize:9, fontWeight:600,
          textTransform:"uppercase", letterSpacing:"0.14em",
          color: inv ? "rgba(255,255,255,0.38)" : "#A2A9AD",
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
// SLIDES
// ══════════════════════════════════════════════════════════════════════════════
 
// 0 — PORTADA
function Slide0({ d, ia }) {
  return (
    <div className="aw-fill" style={{ background:"#EB0029", position:"relative", overflow:"hidden" }}>
      {/* Textura geométrica */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.06}} viewBox="0 0 360 650" preserveAspectRatio="xMidYMid slice">
        <circle cx="300" cy="80"  r="180" fill="white"/>
        <circle cx="30"  cy="580" r="140" fill="white"/>
        <circle cx="180" cy="320" r="60"  fill="white"/>
      </svg>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.1) 0%,transparent 40%,rgba(0,0,0,0.25) 100%)"}}/>
 
      <SlideTop label={`${d.mes} ${d.anio}`}/>
 
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 24px", position:"relative", zIndex:1 }}>
        <div className="aw-fu" style={{ animationDelay:"0.05s", marginBottom:6 }}>
          <span style={{ fontFamily:'"Gotham",sans-serif', fontSize:10, fontWeight:500, color:"rgba(255,255,255,0.55)", letterSpacing:"0.18em", textTransform:"uppercase" }}>
            Resumen del mes
          </span>
        </div>
 
        <h1 className="aw-fu" style={{
          fontFamily:'"Gotham",sans-serif', fontWeight:700,
          fontSize: ia?.frase ? (ia.frase.length > 30 ? 26 : 32) : 28,
          color:"#fff", lineHeight:1.15, margin:"0 0 24px",
          animationDelay:"0.15s",
        }}>
          {ia?.frase ?? (d.vacio ? "Empieza a\nregistrar tus\nfinanzas" : "Tu mes financiero\nen un vistazo")}
        </h1>
 
        {ia?.perfil && (
          <div className="aw-fu" style={{ animationDelay:"0.28s", display:"inline-flex", alignItems:"center", gap:7, alignSelf:"flex-start" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.6)" }}/>
            <span style={{ fontFamily:'"Gotham",sans-serif', fontSize:12, color:"rgba(255,255,255,0.75)", fontWeight:500 }}>
              {ia.perfil}
            </span>
          </div>
        )}
      </div>
 
      {/* Número grande decorativo */}
      <div className="aw-fu" style={{ padding:"0 24px 28px", animationDelay:"0.4s", position:"relative", zIndex:1 }}>
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.18)", paddingTop:16, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:11, color:"rgba(255,255,255,0.45)", margin:0 }}>
            {d.numTx} movimientos · {d.numI} ingresos · {d.numE} egresos
          </p>
          <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"rgba(255,255,255,0.3)", margin:0 }}>1 →</p>
        </div>
      </div>
    </div>
  );
}
 
// 1 — BALANCE
function Slide1({ d }) {
  const pos = d.balance >= 0;
  return (
    <div className="aw-fill" style={{ background:"#323E48", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-120, right:-100, width:320, height:320, borderRadius:"50%", background:"rgba(235,0,41,0.08)" }}/>
      <div style={{ position:"absolute", bottom:-60, left:-40,  width:200, height:200, borderRadius:"50%", background:"rgba(235,0,41,0.05)" }}/>
 
      <SlideTop label="Balance del mes"/>
 
      <div style={{ flex:1, padding:"20px 22px 0", position:"relative", zIndex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
 
        {/* Número grande */}
        <p className="aw-fu" style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"#7B868C", textTransform:"uppercase", letterSpacing:"0.12em", margin:"0 0 4px", animationDelay:"0.05s" }}>
          Balance neto
        </p>
        <p className="aw-fu" style={{ fontFamily:'"Gotham",sans-serif', fontWeight:700, fontSize:50, color:pos?"#6CC04A":"#EB0029", margin:"0 0 6px", lineHeight:1, animationDelay:"0.12s" }}>
          {pos?"+":""}<CountUp value={Math.abs(d.balance)} prefix="$" duration={1000}/>
        </p>
        <p className="aw-fu" style={{ fontFamily:'"Roboto",sans-serif', fontSize:12, color:"#5B6670", margin:"0 0 28px", animationDelay:"0.18s" }}>
          {d.vacio ? "Sin movimientos registrados este mes"
           : pos ? `Ahorraste el ${d.ahorroPct}% de tus ingresos 🎉`
                 : "Tus egresos superaron tus ingresos este mes"}
        </p>
 
        {/* Grid stats */}
        <div className="aw-fu" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, animationDelay:"0.28s" }}>
          {[
            { l:"Ingresos",  v:d.totalI, dot:"#6CC04A", n:d.numI  },
            { l:"Egresos",   v:d.totalE, dot:"#EB0029", n:d.numE  },
          ].map(({l,v,dot,n}) => (
            <div key={l} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px 16px" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:dot, marginBottom:8 }}/>
              <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:9, color:"#5B6670", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 4px" }}>{l}</p>
              <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:17, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>
                <CountUp value={v} prefix="$" duration={900}/>
              </p>
              <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"#3E4A52", margin:0 }}>{n} movimientos</p>
            </div>
          ))}
        </div>
 
        <div className="aw-fu" style={{ marginTop:10, animationDelay:"0.38s", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"#5B6670", textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>Total de movimientos</p>
          <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:24, fontWeight:700, color:"#fff", margin:0 }}>
            <CountUp value={d.numTx} duration={800}/>
          </p>
        </div>
      </div>
      <div style={{ padding:"14px 22px", position:"relative", zIndex:1 }}><div style={{ width:4, height:4, borderRadius:"50%", background:"rgba(235,0,41,0.4)", margin:"0 auto" }}/></div>
    </div>
  );
}
 
// 2 — CATEGORÍAS
function Slide2({ d }) {
  const COLS = ["#EB0029","#FF671B","#FFA400","#A2A9AD","#5B6670"];
  const top  = d.catTop;
  return (
    <div className="aw-fill" style={{ background:"#fff", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"linear-gradient(90deg,#EB0029,#FF671B)" }}/>
      <SlideTop label="En qué gastas" dark/>
 
      <div style={{ flex:1, padding:"18px 22px 0", overflow:"hidden" }}>
        {!top ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80%", flexDirection:"column", gap:8 }}>
            <span style={{ fontSize:36 }}>📭</span>
            <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:15, color:"#A2A9AD", textAlign:"center" }}>Sin gastos registrados</p>
          </div>
        ) : (
          <>
            {/* Emoji + nombre grande */}
            <div className="aw-fu" style={{ animationDelay:"0.05s", display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
              <div style={{ fontSize:42, lineHeight:1 }}>{CAT_EMO[top.nombre]??'💳'}</div>
              <div>
                <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:9, color:"#A2A9AD", textTransform:"uppercase", letterSpacing:"0.12em", margin:"0 0 2px" }}>Mayor gasto</p>
                <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:26, fontWeight:700, color:"#323E48", margin:"0 0 2px", lineHeight:1.1 }}>{top.nombre}</p>
                <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:20, fontWeight:700, color:"#EB0029", margin:0 }}>
                  <CountUp value={top.total} prefix="$" duration={900}/>
                  <span style={{ fontFamily:'"Roboto",sans-serif', fontSize:11, color:"#A2A9AD", fontWeight:400, marginLeft:6 }}>{top.pct}%</span>
                </p>
              </div>
            </div>
 
            {/* Barras */}
            <div className="aw-fu" style={{ animationDelay:"0.2s", display:"flex", flexDirection:"column", gap:10 }}>
              {d.cats.slice(0,5).map((cat,i) => (
                <div key={cat.nombre}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontFamily:'"Roboto",sans-serif', fontSize:12, color:"#5B6670", display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ fontSize:13 }}>{CAT_EMO[cat.nombre]??'💳'}</span>
                      {cat.nombre}
                    </span>
                    <span style={{ fontFamily:'"Gotham",sans-serif', fontSize:11, fontWeight:600, color:"#323E48" }}>{cat.pct}%</span>
                  </div>
                  <Bar pct={cat.pct} color={COLS[i%COLS.length]} delay={i*80} height={6}/>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
 
      <div style={{ height:4, background:"linear-gradient(90deg,#EB0029,#323E48)", margin:"16px 22px 18px" }}/>
    </div>
  );
}
 
// 3 — CURIOSIDADES
function Slide3({ d }) {
  return (
    <div className="aw-fill" style={{ background:"#323E48", position:"relative", overflow:"hidden" }}>
      {/* Patrón sutil */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.03 }} viewBox="0 0 360 650">
        {[60,160,260].map((x,i)=>[100,300,500].map((y,j)=>(
          <rect key={`${i}${j}`} x={x-30} y={y-30} width={60} height={60} rx={8} fill="none" stroke="#EB0029" strokeWidth={1} transform={`rotate(${(i+j)*12} ${x} ${y})`}/>
        )))}
      </svg>
 
      <SlideTop label="Datos del mes"/>
 
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 22px", gap:12, position:"relative", zIndex:1 }}>
 
        <div className="aw-fu" style={{ animationDelay:"0.05s", background:"rgba(235,0,41,0.14)", border:"1px solid rgba(235,0,41,0.28)", borderRadius:16, padding:"16px 18px" }}>
          <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:9, color:"#EB0029", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, margin:"0 0 6px" }}>📅 Tu día de más gasto</p>
          <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:32, fontWeight:700, color:"#fff", margin:0 }}>{d.vacio?"—":d.diaTop}</p>
        </div>
 
        <div className="aw-fu" style={{ animationDelay:"0.17s", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"16px 18px" }}>
          <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:9, color:"#A2A9AD", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, margin:"0 0 6px" }}>💸 Gasto más grande del mes</p>
          {d.txMax ? (
            <>
              <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:24, fontWeight:700, color:"#fff", margin:"0 0 3px" }}>
                <CountUp value={d.txMax.amount} prefix="$" duration={900}/>
              </p>
              <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:11, color:"#5B6670", margin:0 }}>{d.txMax.description}</p>
            </>
          ) : (
            <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:13, color:"#3E4A52", margin:0 }}>Sin transacciones</p>
          )}
        </div>
 
        <div className="aw-fu" style={{ animationDelay:"0.28s", background:"rgba(108,192,74,0.1)", border:"1px solid rgba(108,192,74,0.22)", borderRadius:16, padding:"16px 18px" }}>
          <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:9, color:"#6CC04A", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, margin:"0 0 6px" }}>📈 Capital invertido activo</p>
          <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:24, fontWeight:700, color:"#fff", margin:"0 0 3px" }}>
            {d.invActivas > 0 ? <><CountUp value={d.totalInv} prefix="$" duration={900}/></> : "Sin inversiones"}
          </p>
          {d.invActivas > 0 && (
            <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:11, color:"#6CC04A", margin:0 }}>
              {d.invActivas} activas{d.porVencer>0?` · ${d.porVencer} por vencer`:""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
 
// 4 — AURA IA
function Slide4({ d, ia, iaLoading }) {
  return (
    <div className="aw-fill" style={{ background:"#EB0029", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-80,  left:-60,  width:280, height:280, borderRadius:"50%", background:"rgba(0,0,0,0.14)" }}/>
      <div style={{ position:"absolute", bottom:-40,right:-30, width:180, height:180, borderRadius:"50%", background:"rgba(0,0,0,0.1)" }}/>
 
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px 0", position:"relative", zIndex:1 }}>
        <img src={banorteLogo} alt="Banorte" style={{ height:19, filter:"brightness(0) invert(1)" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <Sparkles size={11} color="rgba(255,255,255,0.6)"/>
          <span style={{ fontFamily:'"Gotham",sans-serif', fontSize:9, color:"rgba(255,255,255,0.45)", letterSpacing:"0.14em", textTransform:"uppercase" }}>Análisis Aura</span>
        </div>
      </div>
 
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 22px", gap:12, position:"relative", zIndex:1 }}>
        {iaLoading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <div style={{ display:"flex", gap:8 }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"rgba(255,255,255,0.65)", animation:`awBounce 1.1s ease-in-out ${i*0.17}s infinite` }}/>
              ))}
            </div>
            <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:13, color:"rgba(255,255,255,0.55)" }}>Aura está analizando…</p>
          </div>
        ) : ia ? (
          <>
            <div className="aw-fu" style={{ animationDelay:"0.08s", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"16px 18px" }}>
              <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:9, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, margin:"0 0 7px" }}>🏆 Tu logro del mes</p>
              <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:16, fontWeight:600, color:"#fff", margin:0, lineHeight:1.45 }}>{ia.logro}</p>
            </div>
            <div className="aw-fu" style={{ animationDelay:"0.2s", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"16px 18px" }}>
              <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:9, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, margin:"0 0 7px" }}>🎯 Para el próximo mes</p>
              <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:15, fontWeight:600, color:"#fff", margin:0, lineHeight:1.45 }}>{ia.consejo}</p>
            </div>
          </>
        ) : (
          <div className="aw-fu" style={{ animationDelay:"0.08s", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, padding:"24px 20px", textAlign:"center" }}>
            <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:13, color:"rgba(255,255,255,0.6)", margin:0, lineHeight:1.6 }}>
              {d.vacio
                ? "Registra transacciones para obtener análisis personalizados de Aura."
                : "Análisis IA no disponible.\nAsegúrate de que Ollama esté corriendo."}
            </p>
          </div>
        )}
      </div>
 
      <div style={{ padding:"14px 22px 20px", position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.1)", marginTop:"auto" }}>
        <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"rgba(255,255,255,0.25)", textAlign:"center", margin:0 }}>Powered by Aura · Banorte</p>
      </div>
    </div>
  );
}
 
// 5 — CIERRE
function Slide5({ d, ia }) {
  const pos = d.balance >= 0;
  return (
    <div className="aw-fill" style={{ background:"#fff", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"#EB0029" }}/>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px 0" }}>
        <img src={banorteLogo} alt="Banorte" style={{ height:19 }}/>
        <span style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"#A2A9AD", textTransform:"capitalize" }}>{d.mes} {d.anio}</span>
      </div>
 
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"0 24px", textAlign:"center" }}>
 
        <div className="aw-fu" style={{ animationDelay:"0.05s" }}>
          <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"#A2A9AD", textTransform:"uppercase", letterSpacing:"0.12em", margin:"0 0 8px" }}>Balance de {d.mes}</p>
        </div>
 
        <p className="aw-fu" style={{ fontFamily:'"Gotham",sans-serif', fontWeight:700, fontSize:54, color:pos?"#6CC04A":"#EB0029", margin:"0 0 8px", lineHeight:1, animationDelay:"0.15s" }}>
          {pos?"+":""}<CountUp value={Math.abs(d.balance)} prefix="$" duration={1100}/>
        </p>
 
        <p className="aw-fu" style={{ fontFamily:'"Roboto",sans-serif', fontSize:12, color:"#A2A9AD", margin:"0 0 28px", animationDelay:"0.22s" }}>
          {d.vacio ? "Registra tus primeros movimientos"
           : pos ? `Ahorraste el ${d.ahorroPct}% de lo que ingresaste`
                 : "Oportunidad de mejorar el próximo mes"}
        </p>
 
        <div className="aw-fu" style={{ width:36, height:3, background:"#EB0029", borderRadius:999, margin:"0 0 24px", animationDelay:"0.3s" }}/>
 
        {ia?.perfil && (
          <div className="aw-fu" style={{ background:"#323E48", borderRadius:16, padding:"14px 24px", marginBottom:20, animationDelay:"0.38s" }}>
            <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:9, color:"#5B6670", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 4px" }}>Perfil Aura</p>
            <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:20, fontWeight:700, color:"#fff", margin:0 }}>{ia.perfil}</p>
          </div>
        )}
 
        <p className="aw-fu" style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"#C1C5C8", animationDelay:"0.44s" }}>
          {d.numTx} movimientos · {d.invActivas} inversiones activas
        </p>
      </div>
 
      {/* Footer rojo */}
      <div style={{ background:"#EB0029", padding:"12px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <img src={banorteLogo} alt="Banorte" style={{ height:18, filter:"brightness(0) invert(1)" }}/>
        <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:10, color:"rgba(255,255,255,0.45)", margin:0 }}>Aura · Asistente Financiero</p>
      </div>
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function AuraWrapped({ onClose }) {
  const [step,      setStep]      = useState("loading"); // loading | ready | error
  const [slide,     setSlide]     = useState(0);
  const [dir,       setDir]       = useState("next");
  const [data,      setData]      = useState(null);
  const [ia,        setIa]        = useState(null);
  const [iaLoading, setIaLoading] = useState(false);
  const touchRef = useRef(null);
 
  // Carga datos del mes actual
  useEffect(() => {
    const ahora  = new Date();
    const mes    = String(ahora.getMonth()+1).padStart(2,"0");
    const inicio = `${ahora.getFullYear()}-${mes}-01`;
    const fin    = ahora.toISOString().slice(0,10);
 
    Promise.all([
      fetchTransactions({ page:1, limit:500, startDate:inicio, endDate:fin }),
      fetchInversiones().catch(() => []),
    ])
    .then(([txRes, inv]) => {
      const d = calcular(txRes.data ?? [], inv);
      setData(d);
      setStep("ready");
      if (!d.vacio) {
        setIaLoading(true);
        pediria(d).then(setIa).catch(() => setIa(null)).finally(() => setIaLoading(false));
      }
    })
    .catch(() => setStep("error"));
  }, []);
 
  const TOTAL = 6;
 
  const goTo = useCallback((n, d) => { setDir(d); setSlide(n); }, []);
  const next = useCallback(() => { if (slide < TOTAL-1) goTo(slide+1, "next"); }, [slide, goTo]);
  const prev = useCallback(() => { if (slide > 0)       goTo(slide-1, "prev"); }, [slide, goTo]);
 
  useEffect(() => {
    const h = e => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "Escape")     onClose?.();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, onClose]);
 
  const onTS = e => { touchRef.current = e.touches[0].clientX; };
  const onTE = e => {
    if (!touchRef.current) return;
    const diff = touchRef.current - e.changedTouches[0].clientX;
    if (diff >  44) next();
    if (diff < -44) prev();
    touchRef.current = null;
  };
 
  const slides = data ? [
    <Slide0 key={0} d={data} ia={ia}/>,
    <Slide1 key={1} d={data}/>,
    <Slide2 key={2} d={data}/>,
    <Slide3 key={3} d={data}/>,
    <Slide4 key={4} d={data} ia={ia} iaLoading={iaLoading}/>,
    <Slide5 key={5} d={data} ia={ia}/>,
  ] : [];
 
  const animClass = dir === "next" ? "aw-slide-next" : "aw-slide-prev";
 
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:999, backdropFilter:"blur(12px)", animation:"awOvIn 0.22s ease" }}
      />
 
      {/* Modal */}
      <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
        <div
          style={{ width:"100%", maxWidth:356, height:"min(648px,88vh)", borderRadius:26, overflow:"hidden", position:"relative", boxShadow:"0 48px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)", animation:"awMoIn 0.38s cubic-bezier(0.34,1.56,0.64,1)" }}
          onTouchStart={onTS}
          onTouchEnd={onTE}
        >
 
          {/* ── LOADING ── */}
          {step === "loading" && (
            <div style={{ height:"100%", background:"#EB0029", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:22, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-80, right:-80, width:260, height:260, borderRadius:"50%", background:"rgba(0,0,0,0.1)" }}/>
              <img src={banorteLogo} alt="Banorte" style={{ height:26, filter:"brightness(0) invert(1)", position:"relative", zIndex:1 }}/>
              <div style={{ display:"flex", gap:8, zIndex:1 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"rgba(255,255,255,0.65)", animation:`awBounce 1.1s ease-in-out ${i*0.17}s infinite` }}/>
                ))}
              </div>
              <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:13, color:"rgba(255,255,255,0.5)", zIndex:1 }}>Preparando tu resumen…</p>
            </div>
          )}
 
          {/* ── ERROR ── */}
          {step === "error" && (
            <div style={{ height:"100%", background:"#323E48", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:"0 32px" }}>
              <img src={banorteLogo} alt="Banorte" style={{ height:22, filter:"brightness(0) invert(1)", marginBottom:8 }}/>
              <p style={{ fontFamily:'"Gotham",sans-serif', fontSize:15, color:"#fff", textAlign:"center", margin:0 }}>No se pudo cargar tu resumen</p>
              <p style={{ fontFamily:'"Roboto",sans-serif', fontSize:12, color:"#5B6670", textAlign:"center", margin:0 }}>Verifica la conexión con el servidor</p>
              <button onClick={onClose} style={{ background:"#EB0029", color:"#fff", border:"none", borderRadius:12, padding:"10px 28px", cursor:"pointer", fontFamily:'"Gotham",sans-serif', fontWeight:600, marginTop:8 }}>Cerrar</button>
            </div>
          )}
 
          {/* ── SLIDES ── */}
          {step === "ready" && (
            <>
              {/* Barra de progreso */}
              <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:30, display:"flex", gap:3, padding:"7px 11px", background:"linear-gradient(rgba(0,0,0,0.16),transparent)", pointerEvents:"none" }}>
                {slides.map((_,i) => (
                  <div
                    key={i}
                    onClick={(e) => { e.stopPropagation(); goTo(i, i > slide ? "next" : "prev"); }}
                    style={{ flex:1, height:2.5, borderRadius:999, cursor:"pointer", pointerEvents:"all", background: i <= slide ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.22)", transition:"background 0.3s" }}
                  />
                ))}
              </div>
 
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                style={{ position:"absolute", top:9, right:10, zIndex:31, background:"rgba(0,0,0,0.18)", backdropFilter:"blur(4px)", border:"none", borderRadius:"50%", width:27, height:27, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.8)" }}
              >
                <X size={13}/>
              </button>
 
              {/* Slide actual */}
              <div
                key={`${slide}-${dir}`}
                className={animClass}
                style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column" }}
              >
                {slides[slide]}
              </div>
 
              {/* Navegación inferior */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:30, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"linear-gradient(transparent,rgba(0,0,0,0.28))", pointerEvents:"none" }}>
 
                <button
                  onClick={prev}
                  disabled={slide === 0}
                  style={{ pointerEvents:"all", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(6px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:999, padding:"6px 14px", color:"rgba(255,255,255,0.8)", cursor:slide===0?"not-allowed":"pointer", opacity:slide===0?0.25:1, display:"flex", alignItems:"center", gap:4, fontFamily:'"Gotham",sans-serif', fontSize:11, transition:"opacity 0.2s" }}
                >
                  <ChevronLeft size={13}/> Atrás
                </button>
 
                {/* Dots indicador */}
                <div style={{ display:"flex", gap:4, alignItems:"center", pointerEvents:"all" }}>
                  {slides.map((_,i) => (
                    <div
                      key={i}
                      onClick={() => goTo(i, i > slide ? "next" : "prev")}
                      style={{ width:i===slide?14:5, height:5, borderRadius:999, background:i===slide?"#fff":"rgba(255,255,255,0.28)", transition:"all 0.25s ease", cursor:"pointer" }}
                    />
                  ))}
                </div>
 
                {slide < slides.length-1 ? (
                  <button
                    onClick={next}
                    style={{ pointerEvents:"all", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(6px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:999, padding:"6px 14px", color:"rgba(255,255,255,0.8)", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontFamily:'"Gotham",sans-serif', fontSize:11 }}
                  >
                    Siguiente <ChevronRight size={13}/>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    style={{ pointerEvents:"all", background:"#EB0029", border:"none", borderRadius:999, padding:"6px 18px", color:"#fff", cursor:"pointer", fontFamily:'"Gotham",sans-serif', fontWeight:600, fontSize:11, boxShadow:"0 4px 16px rgba(235,0,41,0.5)" }}
                  >
                    Cerrar ✓
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
 
      {/* ── Todas las animaciones ── */}
      <style>{`
        /* Contenedor base de slide */
        .aw-fill {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }
 
        /* Transiciones entre slides */
        .aw-slide-next {
          animation: awSlideNext 0.36s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .aw-slide-prev {
          animation: awSlidePrev 0.36s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes awSlideNext {
          from { opacity: 0; transform: translateX(30px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes awSlidePrev {
          from { opacity: 0; transform: translateX(-30px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)     scale(1);    }
        }
 
        /* Elementos internos — fade up escalonado */
        .aw-fu {
          animation: awFadeUp 0.42s ease both;
        }
        @keyframes awFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
 
        /* Dots de carga bouncing */
        @keyframes awBounce {
          0%, 60%, 100% { transform: translateY(0);    opacity: 0.65; }
          30%            { transform: translateY(-10px); opacity: 1;    }
        }
 
        /* Modal entrada con spring */
        @keyframes awMoIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
 
        /* Overlay fade */
        @keyframes awOvIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
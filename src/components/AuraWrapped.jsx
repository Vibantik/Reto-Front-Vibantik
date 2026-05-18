// src/components/AuraWrapped.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchTransactions } from "../services/transactionsService";
import { fetchInversiones }  from "../services/inversionesService";
import { X, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import banorteLogo from "../assets/banorte-logo.png";

const API_URL = "http://localhost:3000";

const MESES   = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS    = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const CAT_EMO = { Comida:"🍔", Transporte:"🚗", Entretenimiento:"🎬", Servicios:"⚡", Salud:"💊", Compras:"🛍️", Viajes:"✈️", Educación:"📚", Otros:"💳" };

const fmt  = (n) => Number(n).toLocaleString("es-MX", { style:"currency", currency:"MXN", maximumFractionDigits:0 });
const fmtD = (n) => Number(n).toLocaleString("es-MX", { style:"currency", currency:"MXN" });

// ── Calcular datos del mes ────────────────────────────────────────────────────
function calcular(txs, inversiones) {
  const ahora   = new Date();
  const egresos = txs.filter(t => t.type === "egreso");
  const ing     = txs.filter(t => t.type === "ingreso");
  const totalE  = egresos.reduce((s,t) => s + parseFloat(t.amount||0), 0);
  const totalI  = ing.reduce((s,t)     => s + parseFloat(t.amount||0), 0);
  const balance = totalI - totalE;

  const porCat = {};
  egresos.forEach(t => { const c=t.category||"Otros"; porCat[c]=(porCat[c]||0)+parseFloat(t.amount||0); });
  const cats = Object.entries(porCat)
    .map(([n,v]) => ({ nombre:n, total:v, pct: totalE>0?Math.round(v/totalE*100):0 }))
    .sort((a,b) => b.total-a.total);

  const porDia = {};
  egresos.forEach(t => {
    const d=new Date(t.date);
    if(!isNaN(d)){ const n=DIAS[d.getDay()]; porDia[n]=(porDia[n]||0)+1; }
  });
  const diaTop = Object.entries(porDia).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "—";
  const txMax  = [...egresos].sort((a,b)=>parseFloat(b.amount)-parseFloat(a.amount))[0] ?? null;

  const hoy=new Date(); const en30=new Date(); en30.setDate(en30.getDate()+30);
  const activas = inversiones.filter(i=>new Date(i.fecha_fin)>hoy);

  return {
    mes: MESES[ahora.getMonth()], mesNum: ahora.getMonth()+1, anio: ahora.getFullYear(),
    totalE, totalI, balance,
    numTx: txs.length, numE: egresos.length, numI: ing.length,
    cats, catTop: cats[0]??null, diaTop, txMax,
    invActivas: activas.length,
    totalInv: activas.reduce((s,i)=>s+parseFloat(i.valor||0),0),
    porVencer: activas.filter(i=>new Date(i.fecha_fin)<=en30).length,
    ahorroPct: totalI>0 ? Math.max(0,Math.round(balance/totalI*100)) : 0,
    vacio: txs.length===0,
  };
}

// ── Ollama ────────────────────────────────────────────────────────────────────
async function pedirIA(d) {
  if (d.vacio) throw new Error("sin datos");
  const top=d.cats.slice(0,3).map(c=>`${c.nombre} $${c.total.toFixed(0)}`).join(", ");
  const prompt=`Eres Aura, asistente financiero de Banorte. Analiza ${d.mes} ${d.anio}.
Ingresos $${d.totalI.toFixed(0)}, Egresos $${d.totalE.toFixed(0)}, Balance $${d.balance.toFixed(0)}, Ahorro ${d.ahorroPct}%, Top: ${top}, Día peak: ${d.diaTop}.
Responde SOLO JSON sin markdown: {"frase":"frase motivadora máx 8 palabras","logro":"logro del mes máx 10 palabras","consejo":"consejo accionable máx 12 palabras","perfil":"perfil 2 palabras"}`;
  const res=await fetch(`${API_URL}/api/ia/agentic`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
  if(!res.ok) throw new Error("error");
  const reader=res.body.getReader(),dec=new TextDecoder();
  let acc="";
  while(true){const{done,value}=await reader.read();if(done)break;dec.decode(value,{stream:true}).split("\n").filter(Boolean).forEach(l=>{try{const j=JSON.parse(l);if(j.message?.content)acc+=j.message.content;}catch{}});}
  const m=acc.match(/\{[\s\S]*?\}/);if(!m)throw new Error("no json");
  return JSON.parse(m[0]);
}

// ── CountUp animado ───────────────────────────────────────────────────────────
function CountUp({ value, prefix="", duration=1100 }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start=performance.now(), to=parseFloat(value)||0;
    const tick=(now)=>{
      const p=Math.min((now-start)/duration,1);
      const e=p===1?1:1-Math.pow(2,-10*p);
      setDisplay(to*e);
      if(p<1) raf.current=requestAnimationFrame(tick);
    };
    raf.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf.current);
  },[value,duration]);
  return <>{prefix}{Math.round(display).toLocaleString("es-MX")}</>;
}

// ── Barra animada ─────────────────────────────────────────────────────────────
function Bar({pct, color, delay=0}) {
  const [w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(pct),delay+80);return()=>clearTimeout(t);},[pct,delay]);
  return (
    <div style={{height:6,background:"rgba(0,0,0,0.1)",borderRadius:999,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${w}%`,background:color,borderRadius:999,transition:"width 0.85s cubic-bezier(0.25,0.46,0.45,0.94)"}}/>
    </div>
  );
}

// ── Shared header (logo + label) ─────────────────────────────────────────────
function SlideHeader({label, invert=true}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 0",flexShrink:0}}>
      <img src={banorteLogo} alt="Banorte" style={{height:20,filter:invert?"brightness(0) invert(1)":"none"}}/>
      {label && <span style={{fontFamily:'"Roboto",sans-serif',fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.14em",color:invert?"rgba(255,255,255,0.38)":"#A2A9AD"}}>{label}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDES — cada uno con paddingBottom para que la nav no tape el contenido
// ══════════════════════════════════════════════════════════════════════════════

const NAV_H = 72; // altura reservada para la barra de navegación

// 0 — PORTADA
function S0({d,ia}) {
  return (
    <div className="aw-fill" style={{background:"#EB0029",position:"relative",overflow:"hidden"}}>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.07}} viewBox="0 0 360 650" preserveAspectRatio="xMidYMid slice">
        <circle cx="300" cy="80"  r="200" fill="white"/>
        <circle cx="20"  cy="580" r="160" fill="white"/>
        <circle cx="180" cy="320" r="50"  fill="white"/>
      </svg>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.08) 0%,transparent 40%,rgba(0,0,0,0.2) 100%)"}}/>

      <SlideHeader label={`${d.mes} ${d.anio}`}/>

      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:`0 28px ${NAV_H+8}px`,position:"relative",zIndex:1}}>
        <p className="aw-fu" style={{fontFamily:'"Roboto",sans-serif',fontSize:11,color:"rgba(255,255,255,0.65)",textTransform:"uppercase",letterSpacing:"0.16em",margin:"0 0 12px",animationDelay:"0.05s"}}>
          Resumen del mes
        </p>
        <h1 className="aw-fu" style={{fontFamily:'"Gotham",sans-serif',fontWeight:700,fontSize:ia?.frase&&ia.frase.length>30?24:30,color:"#fff",lineHeight:1.18,margin:"0 0 28px",animationDelay:"0.15s"}}>
          {ia?.frase ?? (d.vacio ? "Empieza a registrar tus finanzas" : "Tu mes financiero en un vistazo")}
        </h1>
        {ia?.perfil && (
          <div className="aw-fu" style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.16)",backdropFilter:"blur(4px)",borderRadius:999,padding:"8px 16px",alignSelf:"flex-start",animationDelay:"0.28s"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,0.7)"}}/>
            <span style={{fontFamily:'"Gotham",sans-serif',fontSize:12,color:"#fff",fontWeight:500}}>{ia.perfil}</span>
          </div>
        )}

        <div className="aw-fu" style={{marginTop:32,animationDelay:"0.4s"}}>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.2)",paddingTop:16}}>
            <p style={{fontFamily:'"Roboto",sans-serif',fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>
              {d.numTx} movimientos · {d.numI} ingresos · {d.numE} egresos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 1 — BALANCE
function S1({d}) {
  const pos=d.balance>=0;
  return (
    <div className="aw-fill" style={{background:"#323E48",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-120,right:-100,width:320,height:320,borderRadius:"50%",background:"rgba(235,0,41,0.08)"}}/>
      <SlideHeader label="Balance del mes"/>
      <div style={{flex:1,padding:`20px 28px ${NAV_H+8}px`,position:"relative",zIndex:1,display:"flex",flexDirection:"column",justifyContent:"center",gap:20}}>

        <div>
          <p className="aw-fu" style={{fontFamily:'"Roboto",sans-serif',fontSize:10,color:"#7B868C",textTransform:"uppercase",letterSpacing:"0.12em",margin:"0 0 6px",animationDelay:"0.05s"}}>
            Balance neto
          </p>
          <p className="aw-fu" style={{fontFamily:'"Gotham",sans-serif',fontWeight:700,fontSize:48,color:pos?"#6CC04A":"#EB0029",margin:"0 0 8px",lineHeight:1,animationDelay:"0.12s"}}>
            {pos?"+":""}<CountUp value={Math.abs(d.balance)} prefix="$" duration={1000}/>
          </p>
          <p className="aw-fu" style={{fontFamily:'"Roboto",sans-serif',fontSize:13,color:"#5B6670",margin:0,animationDelay:"0.18s"}}>
            {d.vacio?"Sin movimientos registrados":pos?`Ahorraste el ${d.ahorroPct}% de tus ingresos 🎉`:"Tus egresos superaron tus ingresos"}
          </p>
        </div>

        <div className="aw-fu" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,animationDelay:"0.28s"}}>
          {[{l:"Ingresos",v:d.totalI,dot:"#6CC04A",n:d.numI},{l:"Egresos",v:d.totalE,dot:"#EB0029",n:d.numE}].map(({l,v,dot,n})=>(
            <div key={l} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"16px 18px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:dot,marginBottom:10}}/>
              <p style={{fontFamily:'"Roboto",sans-serif',fontSize:9,color:"#5B6670",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 4px"}}>{l}</p>
              <p style={{fontFamily:'"Gotham",sans-serif',fontSize:18,fontWeight:700,color:"#fff",margin:"0 0 3px"}}>
                <CountUp value={v} prefix="$" duration={900}/>
              </p>
              <p style={{fontFamily:'"Roboto",sans-serif',fontSize:10,color:"#3E4A52",margin:0}}>{n} mov.</p>
            </div>
          ))}
        </div>

        <div className="aw-fu" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",animationDelay:"0.38s"}}>
          <p style={{fontFamily:'"Roboto",sans-serif',fontSize:10,color:"#5B6670",textTransform:"uppercase",letterSpacing:"0.1em",margin:0}}>Total de movimientos</p>
          <p style={{fontFamily:'"Gotham",sans-serif',fontSize:26,fontWeight:700,color:"#fff",margin:0}}>
            <CountUp value={d.numTx} duration={800}/>
          </p>
        </div>
      </div>
    </div>
  );
}

// 2 — CATEGORÍAS
function S2({d}) {
  const COLS=["#EB0029","#FF671B","#FFA400","#323E48","#A2A9AD"];
  const top=d.catTop;
  return (
    <div className="aw-fill" style={{background:"#fff",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#EB0029,#FF671B)"}}/>
      <SlideHeader label="En qué gastas" invert={false}/>
      <div style={{flex:1,padding:`18px 28px ${NAV_H+8}px`,overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"center",gap:16}}>
        {!top ? (
          <div style={{textAlign:"center",paddingTop:40}}>
            <span style={{fontSize:40}}>📭</span>
            <p style={{fontFamily:'"Gotham",sans-serif',fontSize:15,color:"#A2A9AD",marginTop:12}}>Sin gastos registrados</p>
          </div>
        ) : (
          <>
            <div className="aw-fu" style={{animationDelay:"0.05s"}}>
              <p style={{fontFamily:'"Roboto",sans-serif',fontSize:9,color:"#A2A9AD",textTransform:"uppercase",letterSpacing:"0.12em",margin:"0 0 4px",fontWeight:600}}>Mayor categoría</p>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:38,lineHeight:1}}>{CAT_EMO[top.nombre]??"💳"}</span>
                <div>
                  <p style={{fontFamily:'"Gotham",sans-serif',fontSize:28,fontWeight:700,color:"#323E48",margin:"0 0 2px",lineHeight:1.1}}>{top.nombre}</p>
                  <p style={{fontFamily:'"Gotham",sans-serif',fontSize:20,fontWeight:700,color:"#EB0029",margin:0}}>
                    <CountUp value={top.total} prefix="$" duration={900}/>
                    <span style={{fontFamily:'"Roboto",sans-serif',fontSize:12,color:"#A2A9AD",fontWeight:400,marginLeft:8}}>{top.pct}%</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="aw-fu" style={{animationDelay:"0.2s",display:"flex",flexDirection:"column",gap:12}}>
              {d.cats.slice(0,5).map((cat,i)=>(
                <div key={cat.nombre}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontFamily:'"Roboto",sans-serif',fontSize:13,color:"#5B6670",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:14}}>{CAT_EMO[cat.nombre]??"💳"}</span>{cat.nombre}
                    </span>
                    <span style={{fontFamily:'"Gotham",sans-serif',fontSize:12,fontWeight:600,color:"#323E48"}}>{cat.pct}%</span>
                  </div>
                  <Bar pct={cat.pct} color={COLS[i%COLS.length]} delay={i*80}/>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{height:4,background:"linear-gradient(90deg,#EB0029,#323E48)",margin:"0 28px",flexShrink:0}}/>
      <div style={{height:NAV_H-4}}/>
    </div>
  );
}

// 3 — CURIOSIDADES
function S3({d}) {
  return (
    <div className="aw-fill" style={{background:"#323E48",position:"relative",overflow:"hidden"}}>
      <SlideHeader label="Datos del mes"/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:`24px 28px ${NAV_H+24}px`,gap:14,position:"relative",zIndex:1}}>

        <div className="aw-fu" style={{animationDelay:"0.08s",background:"rgba(235,0,41,0.14)",border:"1px solid rgba(235,0,41,0.28)",borderRadius:18,padding:"20px 22px"}}>
          <p style={{fontFamily:'"Roboto",sans-serif',fontSize:9,color:"#EB0029",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600,margin:"0 0 8px"}}>📅 Tu día de más gasto</p>
          <p style={{fontFamily:'"Gotham",sans-serif',fontSize:34,fontWeight:700,color:"#fff",margin:0}}>{d.vacio?"—":d.diaTop}</p>
        </div>

        <div className="aw-fu" style={{animationDelay:"0.18s",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:"20px 22px"}}>
          <p style={{fontFamily:'"Roboto",sans-serif',fontSize:9,color:"#A2A9AD",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600,margin:"0 0 8px"}}>💸 Gasto más grande del mes</p>
          {d.txMax ? (
            <>
              <p style={{fontFamily:'"Gotham",sans-serif',fontSize:26,fontWeight:700,color:"#fff",margin:"0 0 4px"}}>{fmtD(d.txMax.amount)}</p>
              <p style={{fontFamily:'"Roboto",sans-serif',fontSize:12,color:"#5B6670",margin:0}}>{d.txMax.description}</p>
            </>
          ) : (
            <p style={{fontFamily:'"Roboto",sans-serif',fontSize:13,color:"#3E4A52",margin:0}}>Sin transacciones</p>
          )}
        </div>

        <div className="aw-fu" style={{animationDelay:"0.28s",background:"rgba(108,192,74,0.1)",border:"1px solid rgba(108,192,74,0.22)",borderRadius:18,padding:"20px 22px"}}>
          <p style={{fontFamily:'"Roboto",sans-serif',fontSize:9,color:"#6CC04A",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600,margin:"0 0 8px"}}>📈 Capital invertido activo</p>
          <p style={{fontFamily:'"Gotham",sans-serif',fontSize:26,fontWeight:700,color:"#fff",margin:"0 0 4px"}}>
            {d.invActivas>0 ? <CountUp value={d.totalInv} prefix="$" duration={900}/> : "Sin inversiones"}
          </p>
          {d.invActivas>0 && (
            <p style={{fontFamily:'"Roboto",sans-serif',fontSize:12,color:"#6CC04A",margin:0}}>
              {d.invActivas} activas{d.porVencer>0?` · ${d.porVencer} por vencer`:""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 4 — AURA IA
function S4({d,ia,iaLoading}) {
  return (
    <div className="aw-fill" style={{background:"#EB0029",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-80,left:-60,width:280,height:280,borderRadius:"50%",background:"rgba(0,0,0,0.14)"}}/>
      <div style={{position:"absolute",bottom:-40,right:-30,width:180,height:180,borderRadius:"50%",background:"rgba(0,0,0,0.1)"}}/>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 0",position:"relative",zIndex:1,flexShrink:0}}>
        <img src={banorteLogo} alt="Banorte" style={{height:20,filter:"brightness(0) invert(1)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Sparkles size={12} color="rgba(255,255,255,0.6)"/>
          <span style={{fontFamily:'"Roboto",sans-serif',fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.14em",color:"rgba(255,255,255,0.45)"}}>Análisis Aura</span>
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:`16px 28px ${NAV_H+8}px`,gap:14,position:"relative",zIndex:1}}>
        {iaLoading ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
            <div style={{display:"flex",gap:8}}>{[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:"rgba(255,255,255,0.65)",animation:`awBounce 1.1s ease-in-out ${i*0.17}s infinite`}}/>)}</div>
            <p style={{fontFamily:'"Gotham",sans-serif',fontSize:14,color:"rgba(255,255,255,0.55)"}}>Aura analizando tu mes…</p>
          </div>
        ) : ia ? (
          <>
            <div className="aw-fu" style={{animationDelay:"0.08s",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:18,padding:"20px 22px"}}>
              <p style={{fontFamily:'"Roboto",sans-serif',fontSize:9,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600,margin:"0 0 8px"}}>🏆 Tu logro del mes</p>
              <p style={{fontFamily:'"Gotham",sans-serif',fontSize:17,fontWeight:600,color:"#fff",margin:0,lineHeight:1.45}}>{ia.logro}</p>
            </div>
            <div className="aw-fu" style={{animationDelay:"0.2s",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:18,padding:"20px 22px"}}>
              <p style={{fontFamily:'"Roboto",sans-serif',fontSize:9,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600,margin:"0 0 8px"}}>🎯 Para el próximo mes</p>
              <p style={{fontFamily:'"Gotham",sans-serif',fontSize:16,fontWeight:600,color:"#fff",margin:0,lineHeight:1.45}}>{ia.consejo}</p>
            </div>
          </>
        ) : (
          <div className="aw-fu" style={{animationDelay:"0.08s",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:"28px 22px",textAlign:"center"}}>
            <p style={{fontFamily:'"Roboto",sans-serif',fontSize:13,color:"rgba(255,255,255,0.6)",margin:0,lineHeight:1.6}}>
              {d.vacio?"Registra transacciones para obtener análisis personalizados.":"Análisis IA no disponible.\nAsegúrate de que Ollama esté corriendo."}
            </p>
          </div>
        )}
      </div>

      <div style={{padding:"0 28px 20px",position:"relative",zIndex:1,flexShrink:0}}>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.12)",paddingTop:14}}>
          <p style={{fontFamily:'"Roboto",sans-serif',fontSize:10,color:"rgba(255,255,255,0.28)",textAlign:"center",margin:0}}>Powered by Aura · Banorte</p>
        </div>
      </div>
    </div>
  );
}

// 5 — CIERRE
function S5({d,ia}) {
  const pos=d.balance>=0;
  return (
    <div className="aw-fill" style={{background:"#fff",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"#EB0029"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 0",flexShrink:0}}>
        <img src={banorteLogo} alt="Banorte" style={{height:20}}/>
        <span style={{fontFamily:'"Roboto",sans-serif',fontSize:10,color:"#A2A9AD",textTransform:"capitalize"}}>{d.mes} {d.anio}</span>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"0 28px 24px",textAlign:"center",gap:0}}>
        <p className="aw-fu" style={{fontFamily:'"Roboto",sans-serif',fontSize:10,color:"#A2A9AD",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600,margin:"0 0 10px",animationDelay:"0.05s"}}>
          Balance de {d.mes}
        </p>
        <p className="aw-fu" style={{fontFamily:'"Gotham",sans-serif',fontWeight:700,fontSize:56,color:pos?"#6CC04A":"#EB0029",margin:"0 0 10px",lineHeight:1,animationDelay:"0.15s"}}>
          {pos?"+":""}<CountUp value={Math.abs(d.balance)} prefix="$" duration={1100}/>
        </p>
        <p className="aw-fu" style={{fontFamily:'"Roboto",sans-serif',fontSize:13,color:"#A2A9AD",margin:"0 0 28px",animationDelay:"0.22s"}}>
          {d.vacio?"Registra tus primeros movimientos":pos?`Ahorraste el ${d.ahorroPct}% de lo que ingresaste`:"Oportunidad de mejorar el próximo mes"}
        </p>

        <div className="aw-fu" style={{width:40,height:3,background:"#EB0029",borderRadius:999,margin:"0 0 28px",animationDelay:"0.3s"}}/>

        {ia?.perfil && (
          <div className="aw-fu" style={{background:"#323E48",borderRadius:18,padding:"16px 28px",marginBottom:20,animationDelay:"0.38s"}}>
            <p style={{fontFamily:'"Roboto",sans-serif',fontSize:9,color:"#5B6670",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 5px"}}>Perfil Aura este mes</p>
            <p style={{fontFamily:'"Gotham",sans-serif',fontSize:20,fontWeight:700,color:"#fff",margin:0}}>{ia.perfil}</p>
          </div>
        )}

        <p className="aw-fu" style={{fontFamily:'"Roboto",sans-serif',fontSize:11,color:"#C1C5C8",animationDelay:"0.44s"}}>
          {d.numTx} movimientos · {d.invActivas} inversiones activas
        </p>
      </div>

      {/* Footer rojo */}
      <div style={{background:"#EB0029",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <img src={banorteLogo} alt="Banorte" style={{height:18,filter:"brightness(0) invert(1)"}}/>
        <p style={{fontFamily:'"Roboto",sans-serif',fontSize:10,color:"rgba(255,255,255,0.5)",margin:0}}>Aura · Asistente Financiero</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BARRA DE NAVEGACIÓN — parte del flujo normal (no absolute encima del contenido)
// ══════════════════════════════════════════════════════════════════════════════
function NavBar({slide, total, onPrev, onNext, onClose, darkBg}) {
  // darkBg = true → fondo oscuro del slide → nav glassmorphism oscuro
  // darkBg = false → fondo blanco del slide → nav con borde sutil claro
  const glass = darkBg
    ? { bg:"rgba(0,0,0,0.28)", border:"rgba(255,255,255,0.1)", blur:"blur(12px)" }
    : { bg:"rgba(255,255,255,0.96)", border:"rgba(50,62,72,0.1)", blur:"blur(8px)" };

  const btnBack = {
    bg:     darkBg ? "rgba(255,255,255,0.1)"  : "rgba(50,62,72,0.07)",
    border: darkBg ? "rgba(255,255,255,0.18)" : "rgba(50,62,72,0.14)",
    color:  darkBg ? "rgba(255,255,255,0.85)" : "#323E48",
  };
  const dotOn  = darkBg ? "#fff"              : "#EB0029";
  const dotOff = darkBg ? "rgba(255,255,255,0.22)" : "rgba(50,62,72,0.18)";

  return (
    <div style={{
      flexShrink:0,
      height: NAV_H,
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      padding:"0 20px",
      background: glass.bg,
      backdropFilter: glass.blur,
      WebkitBackdropFilter: glass.blur,
      borderTop: `1px solid ${glass.border}`,
    }}>

      {/* ← Atrás */}
      <button
        onClick={onPrev}
        disabled={slide===0}
        style={{
          display:"flex", alignItems:"center", gap:5,
          background: slide===0 ? "transparent" : btnBack.bg,
          border: `1.5px solid ${slide===0 ? "transparent" : btnBack.border}`,
          borderRadius:999,
          padding:"8px 16px",
          color: slide===0 ? (darkBg?"rgba(255,255,255,0.2)":"rgba(50,62,72,0.2)") : btnBack.color,
          cursor: slide===0 ? "not-allowed" : "pointer",
          fontFamily:'"Gotham",sans-serif',
          fontSize:12, fontWeight:600,
          transition:"all 0.18s",
        }}
      >
        <ChevronLeft size={14} strokeWidth={2.5}/> Atrás
      </button>

      {/* Dots indicadores */}
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        {Array.from({length:total}).map((_,i)=>(
          <div key={i} style={{
            width: i===slide ? 20 : 6,
            height: 6,
            borderRadius:999,
            background: i===slide ? dotOn : dotOff,
            transition:"all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}/>
        ))}
      </div>

      {/* Siguiente → / Cerrar */}
      {slide < total-1 ? (
        <button
          onClick={onNext}
          style={{
            display:"flex", alignItems:"center", gap:5,
            background:"#EB0029",
            border:"none",
            borderRadius:999,
            padding:"9px 20px",
            color:"#fff",
            cursor:"pointer",
            fontFamily:'"Gotham",sans-serif',
            fontSize:12, fontWeight:700,
            boxShadow:"0 4px 16px rgba(235,0,41,0.4)",
            transition:"background 0.15s, transform 0.1s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background="#C8001F"; e.currentTarget.style.transform="scale(1.03)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="#EB0029"; e.currentTarget.style.transform="scale(1)"; }}
        >
          Siguiente <ChevronRight size={14} strokeWidth={2.5}/>
        </button>
      ) : (
        <button
          onClick={onClose}
          style={{
            display:"flex", alignItems:"center", gap:5,
            background:"#323E48",
            border:"none",
            borderRadius:999,
            padding:"9px 20px",
            color:"#fff",
            cursor:"pointer",
            fontFamily:'"Gotham",sans-serif',
            fontSize:12, fontWeight:700,
            transition:"background 0.15s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background="#1a2228"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="#323E48"; }}
        >
          Cerrar ✓
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function AuraWrapped({onClose}) {
  const [step,      setStep]      = useState("loading");
  const [slide,     setSlide]     = useState(0);
  const [dir,       setDir]       = useState("next");
  const [data,      setData]      = useState(null);
  const [ia,        setIa]        = useState(null);
  const [iaLoading, setIaLoading] = useState(false);
  const touchRef = useRef(null);

  useEffect(()=>{
    const ahora=new Date();
    const mes=String(ahora.getMonth()+1).padStart(2,"0");
    const ini=`${ahora.getFullYear()}-${mes}-01`;
    const fin=ahora.toISOString().slice(0,10);
    Promise.all([
      fetchTransactions({page:1,limit:500,startDate:ini,endDate:fin}),
      fetchInversiones().catch(()=>[]),
    ]).then(([txRes,inv])=>{
      const d=calcular(txRes.data??[],inv);
      setData(d); setStep("ready");
      if(!d.vacio){
        setIaLoading(true);
        pedirIA(d).then(setIa).catch(()=>setIa(null)).finally(()=>setIaLoading(false));
      }
    }).catch(()=>setStep("error"));
  },[]);

  const TOTAL=6;
  const goTo=useCallback((n,d)=>{setDir(d);setSlide(n);},[]);
  const next=useCallback(()=>{if(slide<TOTAL-1)goTo(slide+1,"next");},[slide,goTo]);
  const prev=useCallback(()=>{if(slide>0)goTo(slide-1,"prev");},[slide,goTo]);

  useEffect(()=>{
    const h=e=>{if(e.key==="ArrowRight")next();if(e.key==="ArrowLeft")prev();if(e.key==="Escape")onClose?.();};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[next,prev,onClose]);

  const onTS=e=>{touchRef.current=e.touches[0].clientX;};
  const onTE=e=>{
    if(!touchRef.current)return;
    const diff=touchRef.current-e.changedTouches[0].clientX;
    if(diff>44)next();if(diff<-44)prev();
    touchRef.current=null;
  };

  // slides con fondo claro (blanco) → nav usa colores oscuros
  const lightSlides=[2,5];
  const isDarkNav=lightSlides.includes(slide);

  const slides=data?[
    <S0 key={0} d={data} ia={ia}/>,
    <S1 key={1} d={data}/>,
    <S2 key={2} d={data}/>,
    <S3 key={3} d={data}/>,
    <S4 key={4} d={data} ia={ia} iaLoading={iaLoading}/>,
    <S5 key={5} d={data} ia={ia}/>,
  ]:[];

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:999,backdropFilter:"blur(12px)",animation:"awOvIn 0.22s ease"}}/>

      <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
        <div
          style={{
            width:"100%",maxWidth:360,
            height:"min(660px,90vh)",
            borderRadius:26,overflow:"hidden",
            position:"relative",
            display:"flex",flexDirection:"column", // ← clave: flex column
            boxShadow:"0 48px 120px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.07)",
            animation:"awMoIn 0.38s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onTouchStart={onTS}
          onTouchEnd={onTE}
        >

          {/* LOADING */}
          {step==="loading" && (
            <div style={{flex:1,background:"#EB0029",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:22,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-80,right:-80,width:260,height:260,borderRadius:"50%",background:"rgba(0,0,0,0.1)"}}/>
              <img src={banorteLogo} alt="Banorte" style={{height:26,filter:"brightness(0) invert(1)",position:"relative",zIndex:1}}/>
              <div style={{display:"flex",gap:8,zIndex:1}}>{[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:"rgba(255,255,255,0.65)",animation:`awBounce 1.1s ease-in-out ${i*0.17}s infinite`}}/>)}</div>
              <p style={{fontFamily:'"Gotham",sans-serif',fontSize:13,color:"rgba(255,255,255,0.5)",zIndex:1}}>Preparando tu resumen…</p>
            </div>
          )}

          {/* ERROR */}
          {step==="error" && (
            <div style={{flex:1,background:"#323E48",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:"0 32px"}}>
              <img src={banorteLogo} alt="Banorte" style={{height:22,filter:"brightness(0) invert(1)",marginBottom:8}}/>
              <p style={{fontFamily:'"Gotham",sans-serif',fontSize:15,color:"#fff",textAlign:"center",margin:0}}>No se pudo cargar tu resumen</p>
              <button onClick={onClose} style={{background:"#EB0029",color:"#fff",border:"none",borderRadius:12,padding:"10px 28px",cursor:"pointer",fontFamily:'"Gotham",sans-serif',fontWeight:600,marginTop:8}}>Cerrar</button>
            </div>
          )}

          {/* SLIDES */}
          {step==="ready" && (
            <>
              {/* Barra de progreso — arriba, encima del slide */}
              <div style={{position:"absolute",top:0,left:0,right:0,zIndex:30,display:"flex",gap:3,padding:"8px 14px",background:"linear-gradient(rgba(0,0,0,0.15),transparent)",pointerEvents:"none"}}>
                {slides.map((_,i)=>(
                  <div key={i} style={{flex:1,height:2.5,borderRadius:999,background:i<=slide?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.22)",transition:"background 0.3s"}}/>
                ))}
              </div>

              {/* Botón X */}
              <button onClick={onClose} style={{position:"absolute",top:9,right:10,zIndex:31,background:"rgba(0,0,0,0.2)",backdropFilter:"blur(4px)",border:"none",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.85)"}}>
                <X size={13}/>
              </button>

              {/* Slide — ocupa el espacio restante */}
              <div
                key={`${slide}-${dir}`}
                className={dir==="next"?"aw-slide-next":"aw-slide-prev"}
                style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}
              >
                {slides[slide]}
              </div>

              {/* Nav — SIEMPRE AL FONDO, fuera del slide */}
              <NavBar
                slide={slide}
                total={slides.length}
                onPrev={prev}
                onNext={next}
                onClose={onClose}
                darkBg={!isDarkNav}
              />
            </>
          )}
        </div>
      </div>

      <style>{`
        .aw-fill { display:flex; flex-direction:column; width:100%; flex:1; min-height:0; }
        .aw-slide-next { animation: awSlideNext 0.34s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .aw-slide-prev { animation: awSlidePrev 0.34s cubic-bezier(0.25,0.46,0.45,0.94) both; }
        @keyframes awSlideNext { from{opacity:0;transform:translateX(28px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes awSlidePrev { from{opacity:0;transform:translateX(-28px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
        .aw-fu { animation: awFadeUp 0.4s ease both; }
        @keyframes awFadeUp { from{opacity:0;transform:translateY(13px)} to{opacity:1;transform:translateY(0)} }
        @keyframes awBounce { 0%,60%,100%{transform:translateY(0);opacity:.65} 30%{transform:translateY(-10px);opacity:1} }
        @keyframes awMoIn { from{opacity:0;transform:scale(0.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes awOvIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </>
  );
}
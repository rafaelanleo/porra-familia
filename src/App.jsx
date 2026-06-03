import { useState, useEffect, useMemo, useCallback } from 'react'
import { F, ALL_TEAMS, MATCHES, GROUPS, GTEAMS, GCOL, ROUNDS, RN, RC, ACCENT, ADMIN_PW } from './data.js'
import { computeStandings, getR32Auto, getMatchTeams, clearDownstream, getSFLoser, computeScore, EMPTY_PICKS } from './logic.js'
import { saveSubmission, saveDraft, loadDraft, loadAllPredictions, loadOfficial, saveOfficial, togglePaid, subscribeToRanking } from './supabase.js'

const BG = "#070B14"
const GLOW = "rgba(245,158,11,0.5)"

// ── small components ──────────────────────────────────────────────────────────
function Stepper({ value, onChange }) {
  const v = value ?? null
  return (
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      <button onClick={()=>onChange(Math.max(0,(v||0)-1))} style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.08)",color:"white",fontSize:18,fontWeight:"bold",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</button>
      <div onClick={()=>{if(v===null)onChange(0)}} style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:18,cursor:"pointer",background:v!==null?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.05)",color:v!==null?"#FCD34D":"rgba(255,255,255,0.25)",border:v!==null?"1px solid rgba(245,158,11,0.4)":"1px solid rgba(255,255,255,0.08)",flexShrink:0}}>
        {v!==null?v:"·"}
      </div>
      <button onClick={()=>onChange((v||0)+1)} style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.08)",color:"white",fontSize:18,fontWeight:"bold",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
    </div>
  )
}

function MatchRow({ idx, home, away, pred, onChange }) {
  const p = pred||{}
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 0"}}>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end",overflow:"hidden",minWidth:0}}>
        <span style={{color:"white",fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{home}</span>
        <span style={{fontSize:16,flexShrink:0}}>{F[home]||"🏳"}</span>
      </div>
      <Stepper value={p.h??null} onChange={v=>onChange(idx,{...p,h:v})}/>
      <span style={{color:"rgba(255,255,255,0.25)",fontSize:11,fontWeight:"bold",width:8,textAlign:"center",flexShrink:0}}>:</span>
      <Stepper value={p.a??null} onChange={v=>onChange(idx,{...p,a:v})}/>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:6,overflow:"hidden",minWidth:0}}>
        <span style={{fontSize:16,flexShrink:0}}>{F[away]||"🏳"}</span>
        <span style={{color:"white",fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{away}</span>
      </div>
    </div>
  )
}

function GroupBlock({ g, preds, onChange }) {
  const [open, setOpen] = useState(false)
  const ms = MATCHES.map((m,i)=>[m,i]).filter(([m])=>m[0]===g)
  const filled = ms.filter(([_,i])=>preds[i]?.h!=null).length
  return (
    <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:16,overflow:"hidden",marginBottom:8}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{width:36,height:36,borderRadius:10,background:GCOL[g],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"white",flexShrink:0}}>{g}</div>
        <div style={{flex:1,overflow:"hidden"}}>
          <div style={{color:"white",fontWeight:700,fontSize:14}}>Grupo {g}</div>
          <div style={{color:"rgba(255,255,255,0.3)",fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{GTEAMS[g].map(t=>F[t]+" "+t).join("  ·  ")}</div>
        </div>
        <span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:20,background:filled===6?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.07)",color:filled===6?"#4ade80":"rgba(255,255,255,0.4)",flexShrink:0}}>{filled}/6</span>
        <span style={{color:"rgba(255,255,255,0.3)",fontSize:12,display:"inline-block",transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}>▾</span>
      </button>
      {open && (
        <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",padding:"4px 12px 12px"}}>
          {["J1","J2","J3"].map(jor=>(
            <div key={jor}>
              <div style={{color:"rgba(255,255,255,0.25)",fontSize:11,fontWeight:700,padding:"10px 4px 4px"}}>JORNADA {jor[1]}</div>
              {ms.filter(([m])=>m[1]===jor).map(([mm,i])=>(
                <MatchRow key={i} idx={i} home={mm[2]} away={mm[3]} pred={preds[i]} onChange={onChange}/>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamBtn({ team, selected, dimmed, onClick }) {
  return (
    <button onClick={onClick} disabled={!team}
      style={{flex:1,display:"flex",alignItems:"center",gap:6,padding:"10px",borderRadius:10,border:`1px solid ${selected?ACCENT:"rgba(255,255,255,0.1)"}`,background:selected?ACCENT:"rgba(255,255,255,0.05)",color:selected?"#000":"white",fontWeight:600,fontSize:13,cursor:team?"pointer":"default",opacity:dimmed?0.35:1,transition:"all 0.15s",overflow:"hidden",whiteSpace:"nowrap"}}>
      {team&&<span style={{fontSize:15,flexShrink:0}}>{F[team]||"🏳"}</span>}
      <span style={{overflow:"hidden",textOverflow:"ellipsis",flex:1,textAlign:"left"}}>{team||"–"}</span>
      {selected&&<span style={{marginLeft:"auto",fontSize:10,flexShrink:0}}>✓</span>}
    </button>
  )
}

function BracketMatch({ round, mi, auto, picks, onPick }) {
  const [tA,tB] = getMatchTeams(round,mi,auto,picks)
  const winner = (picks[round]||[])[mi]
  const pick = (team) => {
    if (!team) return
    const arr = [...(picks[round]||Array(RC[round]).fill(null))]
    arr[mi] = team
    onPick(clearDownstream({...picks,[round]:arr},round,mi))
  }
  return (
    <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"10px",display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:"rgba(255,255,255,0.2)",fontSize:11,width:18,textAlign:"center",flexShrink:0}}>{mi+1}</span>
      <TeamBtn team={tA} selected={winner===tA} dimmed={!!winner&&winner!==tA} onClick={()=>pick(tA)}/>
      <span style={{color:"rgba(255,255,255,0.2)",fontSize:10,fontWeight:"bold",flexShrink:0}}>vs</span>
      <TeamBtn team={tB} selected={winner===tB} dimmed={!!winner&&winner!==tB} onClick={()=>pick(tB)}/>
    </div>
  )
}

function TeamDD({ value, onChange, placeholder }) {
  const [q,setQ] = useState("")
  const [open,setOpen] = useState(false)
  const opts = ALL_TEAMS.filter(t=>!q||t.toLowerCase().includes(q.toLowerCase()))
  return (
    <div style={{position:"relative"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",minHeight:44}}>
        {value?<><span style={{fontSize:18}}>{F[value]||"🏳"}</span><span style={{color:"white",fontWeight:600,fontSize:14,flex:1}}>{value}</span></>:<span style={{color:"rgba(255,255,255,0.3)",fontSize:14,flex:1}}>{placeholder}</span>}
        <span style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>▾</span>
      </div>
      {open&&(
        <div style={{position:"absolute",zIndex:100,left:0,right:0,marginTop:4,background:"#1E293B",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.7)"}}>
          <div style={{padding:8,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
            <input autoFocus style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"8px 12px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}} placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} onClick={e=>e.stopPropagation()}/>
          </div>
          <div style={{maxHeight:200,overflowY:"auto"}}>
            {opts.map(t=>(
              <button key={t} onClick={()=>{onChange(t);setOpen(false);setQ("")}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:18}}>{F[t]||"🏳"}</span><span style={{color:"white",fontSize:14}}>{t}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── screens ───────────────────────────────────────────────────────────────────
function NameScreen({ onStart }) {
  const [n,setN] = useState("")
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:`radial-gradient(ellipse at 50% 0%,#0d2b0d 0%,${BG} 60%)`}}>
      <div style={{fontSize:70,marginBottom:16,filter:`drop-shadow(0 0 40px ${GLOW})`}}>🏆</div>
      <div style={{color:ACCENT,fontWeight:700,fontSize:13,letterSpacing:6,textTransform:"uppercase",marginBottom:4}}>👨‍👩‍👧‍👦 PORRA FAMILIA</div>
      <h1 style={{color:"white",fontWeight:900,fontSize:42,textTransform:"uppercase",letterSpacing:4,margin:"0 0 8px"}}>MUNDIAL 2026</h1>
      <p style={{color:"rgba(255,255,255,0.4)",fontSize:14,marginBottom:40}}>USA · México · Canadá</p>
      <div style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:12}}>
        <input style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"15px 18px",color:"white",fontSize:20,fontWeight:700,outline:"none",textAlign:"center",boxSizing:"border-box"}}
          autoFocus placeholder="¿Cómo te llamas?" value={n} onChange={e=>setN(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&n.trim())onStart(n.trim())}}/>
        <button disabled={!n.trim()} onClick={()=>onStart(n.trim())}
          style={{padding:"16px",borderRadius:16,background:n.trim()?ACCENT:"rgba(255,255,255,0.07)",color:n.trim()?"#000":"rgba(255,255,255,0.2)",fontWeight:900,fontSize:20,border:"none",cursor:n.trim()?"pointer":"not-allowed",letterSpacing:2,textTransform:"uppercase",boxShadow:n.trim()?`0 8px 30px ${GLOW}`:"none",transition:"all 0.2s"}}>
          ENTRAR →
        </button>
      </div>
    </div>
  )
}

function PredictScreen({ name, onDone }) {
  const [step,setStep] = useState(0)
  const [gp,setGp] = useState({})
  const [picks,setPicks] = useState(EMPTY_PICKS())
  const [third,setThird] = useState(null)
  const [scorer,setScorer] = useState("")
  const [loading,setLoading] = useState(true)
  const [saved,setSaved] = useState(false)
  const [submitting,setSubmitting] = useState(false)

  const st = useMemo(()=>computeStandings(gp),[gp])
  const auto = useMemo(()=>getR32Auto(st),[st])
  const champion = (picks.FN||[])[0]||null
  const lA = getSFLoser(picks,0), lB = getSFLoser(picks,1)
  const filled = Object.values(gp).filter(p=>p?.h!=null).length

  useEffect(()=>{
    loadDraft(name).then(d=>{
      if (d) {
        setGp(d.gp||{})
        if (d.picks) setPicks({...EMPTY_PICKS(),...d.picks})
        setThird(d.third||null); setScorer(d.scorer||"")
      }
      setLoading(false)
    })
  },[name])

  useEffect(()=>{
    if (loading) return
    const t = setTimeout(async()=>{
      await saveDraft(name,{gp,picks,third,scorer})
      setSaved(true); setTimeout(()=>setSaved(false),2000)
    },800)
    return ()=>clearTimeout(t)
  },[gp,picks,third,scorer,loading])

  const handleGp = (idx,val) => setGp(p=>({...p,[idx]:val}))

  const doSubmit = async () => {
    setSubmitting(true)
    await saveSubmission({name,groups:gp,picks,r32auto:auto,third,scorer,champion,timestamp:Date.now(),paid:false})
    setSubmitting(false)
    onDone()
  }

  if (loading) return (<div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"rgba(255,255,255,0.4)",fontSize:18}}>Cargando...</div></div>)

  const tabs=[{l:"Grupos",i:"⚽"},{l:"Bracket",i:"🗓"},{l:"Bonus",i:"⭐"},{l:"Enviar",i:"✅"}]
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column"}}>
      <div style={{position:"sticky",top:0,zIndex:40,background:"rgba(7,11,20,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",padding:"12px 16px",gap:10}}>
          <span style={{color:ACCENT,fontWeight:900,fontSize:16,textTransform:"uppercase",letterSpacing:2}}>🏆 MUNDIAL 2026</span>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
            {saved&&<span style={{color:"#4ade80",fontSize:12}}>✓ Guardado</span>}
            <span style={{color:"rgba(255,255,255,0.3)",fontSize:13}}>{name}</span>
          </div>
        </div>
        <div style={{display:"flex",padding:"0 12px 12px",gap:6,overflowX:"auto"}}>
          {tabs.map((t,i)=>(
            <button key={i} onClick={()=>setStep(i)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,whiteSpace:"nowrap",background:step===i?ACCENT:"rgba(255,255,255,0.07)",color:step===i?"#000":"rgba(255,255,255,0.4)",transition:"all 0.2s"}}>
              {t.i} {t.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 100px"}}>
        {step===0&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h2 style={{color:"white",fontWeight:900,fontSize:24,textTransform:"uppercase",letterSpacing:2,margin:0}}>Grupos</h2>
              <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,background:filled===72?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.08)",color:filled===72?"#4ade80":"rgba(255,255,255,0.4)"}}>{filled}/72</span>
            </div>
            <p style={{color:"rgba(255,255,255,0.35)",fontSize:13,marginBottom:16}}>Toca "·" para activar y usa +/− para el marcador.</p>
            {GROUPS.split("").map(g=>(<GroupBlock key={g} g={g} preds={gp} onChange={handleGp}/>))}
          </div>
        )}
        {step===1&&(
          <div>
            <h2 style={{color:"white",fontWeight:900,fontSize:24,textTransform:"uppercase",letterSpacing:2,margin:"0 0 8px"}}>Eliminatorias</h2>
            <p style={{color:"rgba(255,255,255,0.35)",fontSize:13,marginBottom:20}}>Los equipos de 16avos salen de tu clasificación. Toca quién crees que pasa.</p>
            {ROUNDS.map(round=>(
              <div key={round} style={{marginBottom:22}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{height:1,flex:1,background:"rgba(255,255,255,0.09)"}}/>
                  <span style={{color:ACCENT,fontWeight:900,fontSize:12,letterSpacing:3,textTransform:"uppercase"}}>{RN[round]}</span>
                  <div style={{height:1,flex:1,background:"rgba(255,255,255,0.09)"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {Array(RC[round]).fill(0).map((_,mi)=>(<BracketMatch key={mi} round={round} mi={mi} auto={auto} picks={picks} onPick={setPicks}/>))}
                </div>
              </div>
            ))}
            {(lA||lB)&&(
              <div style={{marginBottom:22}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{height:1,flex:1,background:"rgba(255,255,255,0.09)"}}/>
                  <span style={{color:ACCENT,fontWeight:900,fontSize:12,letterSpacing:3}}>TERCER PUESTO 🥉</span>
                  <div style={{height:1,flex:1,background:"rgba(255,255,255,0.09)"}}/>
                </div>
                <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:10,display:"flex",alignItems:"center",gap:8}}>
                  <TeamBtn team={lA} selected={third===lA} dimmed={!!third&&third!==lA} onClick={()=>lA&&setThird(lA)}/>
                  <span style={{color:"rgba(255,255,255,0.2)",fontSize:10,fontWeight:"bold",flexShrink:0}}>vs</span>
                  <TeamBtn team={lB} selected={third===lB} dimmed={!!third&&third!==lB} onClick={()=>lB&&setThird(lB)}/>
                </div>
              </div>
            )}
          </div>
        )}
        {step===2&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div>
              <h2 style={{color:"white",fontWeight:900,fontSize:24,textTransform:"uppercase",letterSpacing:2,margin:"0 0 8px"}}>Apuestas Especiales</h2>
              <p style={{color:"rgba(255,255,255,0.35)",fontSize:13}}>Puntos extra al final del torneo.</p>
            </div>
            {champion
              ?(<div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:16,padding:16,display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:32}}>🥇</span>
                  <div style={{flex:1}}><div style={{color:"rgba(255,255,255,0.45)",fontSize:11,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Campeón</div><div style={{color:"white",fontWeight:700,fontSize:16}}>{F[champion]} {champion}</div></div>
                  <span style={{color:ACCENT,fontWeight:900}}>+12 pts</span>
                </div>)
              :(<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:16,color:"rgba(255,255,255,0.3)",fontSize:14}}>Completa el bracket para ver el campeón.</div>)
            }
            {third&&(<div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:16,display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:32}}>🥉</span>
              <div style={{flex:1}}><div style={{color:"rgba(255,255,255,0.45)",fontSize:11,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Tercer puesto</div><div style={{color:"white",fontWeight:700,fontSize:16}}>{F[third]} {third}</div></div>
              <span style={{color:ACCENT,fontWeight:900}}>+6 pts</span>
            </div>)}
            <div>
              <label style={{color:"rgba(255,255,255,0.45)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:10}}>⚽ Máximo Goleador <span style={{color:ACCENT}}>+6 pts</span></label>
              <input style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px 16px",color:"white",fontSize:15,outline:"none",boxSizing:"border-box"}} placeholder="Nombre del pichichi" value={scorer} onChange={e=>setScorer(e.target.value)}/>
            </div>
          </div>
        )}
        {step===3&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <h2 style={{color:"white",fontWeight:900,fontSize:24,textTransform:"uppercase",letterSpacing:2,margin:"0 0 8px"}}>Resumen y Envío</h2>
            {[
              {label:"Partidos de grupos",val:filled+"/72 rellenos",ok:filled>0},
              {label:"Bracket / Campeón",val:champion?F[champion]+" "+champion:"Sin completar",ok:!!champion},
              {label:"Tercer puesto",val:third?F[third]+" "+third:"Sin seleccionar",ok:!!third},
              {label:"Máximo goleador",val:scorer||"Sin rellenar",ok:!!scorer},
            ].map(({label,val,ok})=>(
              <div key={label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,background:ok?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.05)",color:ok?"#4ade80":"rgba(255,255,255,0.2)",flexShrink:0}}>{ok?"✓":"○"}</div>
                <div><div style={{color:"rgba(255,255,255,0.4)",fontSize:11,textTransform:"uppercase",letterSpacing:1}}>{label}</div><div style={{color:"white",fontWeight:600,fontSize:14}}>{val}</div></div>
              </div>
            ))}
            <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:14,padding:14,color:"#FCD34D",fontSize:13}}>⚠️ Una vez enviado no podrás cambiar tu pronóstico.</div>
            <button onClick={doSubmit} disabled={submitting||filled===0}
              style={{padding:"17px",borderRadius:16,background:filled>0?ACCENT:"rgba(255,255,255,0.08)",color:filled>0?"#000":"rgba(255,255,255,0.2)",fontWeight:900,fontSize:20,border:"none",cursor:filled>0?"pointer":"not-allowed",letterSpacing:2,textTransform:"uppercase",boxShadow:filled>0?`0 8px 30px ${GLOW}`:"none"}}>
              {submitting?"ENVIANDO...":"🏆 ENVIAR MI PORRA"}
            </button>
          </div>
        )}
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(7,11,20,0.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex"}}>
        {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:16,background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontWeight:600,fontSize:14,cursor:"pointer"}}>← Atrás</button>}
        {step<3&&<button onClick={()=>setStep(s=>s+1)} style={{flex:1,padding:16,background:"none",border:"none",color:ACCENT,fontWeight:700,fontSize:14,cursor:"pointer"}}>Siguiente →</button>}
      </div>
    </div>
  )
}

function RankingScreen({ onBack }) {
  const [subs,setSubs] = useState([])
  const [off,setOff] = useState(null)
  const [loading,setLoading] = useState(true)

  const reload = useCallback(async()=>{
    const [s,o] = await Promise.all([loadAllPredictions(),loadOfficial()])
    setSubs(s); setOff(o); setLoading(false)
  },[])

  useEffect(()=>{
    reload()
    let channel
    subscribeToRanking(()=>reload()).then(ch=>{channel=ch})
    return ()=>{ channel?.unsubscribe() }
  },[reload])

  const ranked = useMemo(()=>{
    if (!off) return subs.map(s=>({...s,sc:{total:0,exact:0,sign:0}}))
    return subs.map(s=>({...s,sc:computeScore(s,off)})).sort((a,b)=>b.sc.total-a.sc.total||b.sc.exact-a.sc.exact||b.sc.sign-a.sc.sign)
  },[subs,off])

  const bote = subs.filter(s=>s.paid).length*5
  const medals = ["🥇","🥈","🥉"]
  const sp = [0.7,0.2,0.1]

  if (loading) return (<div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"rgba(255,255,255,0.4)",fontSize:18}}>Cargando...</div></div>)
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column"}}>
      <div style={{position:"sticky",top:0,zIndex:40,background:"rgba(7,11,20,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",padding:"14px 16px",gap:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:20,cursor:"pointer",padding:0}}>←</button>
        <span style={{color:"white",fontWeight:900,fontSize:17,textTransform:"uppercase",letterSpacing:2}}>CLASIFICACIÓN</span>
        <div style={{marginLeft:"auto",color:ACCENT,fontWeight:700,fontSize:14}}>💰 {bote}€</div>
      </div>
      {!off&&<div style={{background:"rgba(245,158,11,0.07)",borderBottom:"1px solid rgba(245,158,11,0.18)",padding:"10px 16px",color:"#FCD34D",fontSize:13,textAlign:"center"}}>Resultados pendientes — los puntos aparecerán cuando el admin los introduzca</div>}
      <div style={{padding:16,display:"flex",flexDirection:"column",gap:10,paddingBottom:40}}>
        {ranked.length===0&&<div style={{color:"rgba(255,255,255,0.25)",textAlign:"center",padding:"60px 0",fontSize:16}}>Nadie ha enviado su porra todavía.</div>}
        {ranked.map((s,i)=>{
          const top=i<3; const prize=i<3?bote*sp[i]:0
          return (
            <div key={s.name} style={{background:top?"rgba(245,158,11,0.07)":"rgba(255,255,255,0.04)",border:`1px solid ${top?"rgba(245,158,11,0.22)":"rgba(255,255,255,0.08)"}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,background:top?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.05)",flexShrink:0}}>
                {medals[i]||<span style={{color:"rgba(255,255,255,0.3)",fontSize:14,fontWeight:700}}>{i+1}</span>}
              </div>
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{color:"white",fontWeight:700,fontSize:16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                <div style={{color:"rgba(255,255,255,0.35)",fontSize:12,marginTop:2}}>{off?s.sc.exact+" exactos · "+s.sc.sign+" signos":"–"} · {s.paid?"✓ Pagado":"⏳ Pago pendiente"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{color:top?ACCENT:"white",fontWeight:900,fontSize:26}}>{off?s.sc.total:"–"}</div>
                {off&&prize>0&&<div style={{color:"#4ade80",fontSize:12,fontWeight:700}}>{prize.toFixed(0)}€</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AdminScreen({ onBack }) {
  const [auth,setAuth] = useState(false)
  const [pw,setPw] = useState("")
  const [tab,setTab] = useState("results")
  const [subs,setSubs] = useState([])
  const [off,setOff] = useState({groups:{},rounds:{},champion:null,third:null,scorer:""})
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)

  useEffect(()=>{
    if (!auth) return
    Promise.all([loadAllPredictions(),loadOfficial()]).then(([s,o])=>{
      setSubs(s); if (o) setOff(o); setLoading(false)
    })
  },[auth])

  const handleGpOff = (idx,val) => setOff(o=>({...o,groups:{...o.groups,[idx]:val}}))
  const save = async()=>{ setSaving(true); await saveOfficial(off); setSaving(false); alert("✓ Guardado") }
  const handlePaid = async(name,cur)=>{ await togglePaid(name,!cur); setSubs(p=>p.map(s=>s.name===name?{...s,paid:!cur}:s)) }

  if (!auth) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <button onClick={onBack} style={{alignSelf:"flex-start",background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:16,cursor:"pointer",marginBottom:40}}>← Volver</button>
      <div style={{fontSize:48,marginBottom:16}}>🔐</div>
      <h2 style={{color:"white",fontWeight:900,fontSize:28,textTransform:"uppercase",letterSpacing:3,margin:"0 0 8px"}}>Admin Panel</h2>
      <p style={{color:"rgba(255,255,255,0.3)",fontSize:14,marginBottom:32}}>Contraseña: <strong>admin2026</strong></p>
      <div style={{width:"100%",maxWidth:300,display:"flex",flexDirection:"column",gap:12}}>
        <input type="password" style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"14px",color:"white",fontSize:18,textAlign:"center",outline:"none",width:"100%",boxSizing:"border-box"}}
          placeholder="Contraseña" value={pw} onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&pw===ADMIN_PW)setAuth(true)}}/>
        <button onClick={()=>{if(pw===ADMIN_PW)setAuth(true);else alert("Contraseña incorrecta")}}
          style={{padding:"15px",borderRadius:14,background:ACCENT,color:"#000",fontWeight:900,fontSize:18,border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:2}}>
          ENTRAR
        </button>
      </div>
    </div>
  )

  if (loading) return (<div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"rgba(255,255,255,0.4)"}}>Cargando...</div></div>)

  const paid = subs.filter(s=>s.paid).length
  return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",flexDirection:"column"}}>
      <div style={{position:"sticky",top:0,zIndex:40,background:"rgba(7,11,20,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",padding:"14px 16px",gap:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:20,cursor:"pointer",padding:0}}>←</button>
        <span style={{color:"white",fontWeight:900,fontSize:16,textTransform:"uppercase",letterSpacing:2}}>ADMIN · FAMILIA</span>
        <div style={{marginLeft:"auto",color:"#4ade80",fontSize:13,fontWeight:700}}>{paid}/{subs.length} pagados · {paid*5}€</div>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        {[["results","📋 Resultados"],["participants","👥 Participantes"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"14px",background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:600,color:tab===id?ACCENT:"rgba(255,255,255,0.35)",borderBottom:tab===id?`2px solid ${ACCENT}`:"2px solid transparent"}}>
            {label}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,paddingBottom:40,display:"flex",flexDirection:"column",gap:14}}>
        {tab==="participants"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {subs.length===0&&<div style={{color:"rgba(255,255,255,0.25)",textAlign:"center",padding:"60px 0"}}>Nadie ha enviado su porra todavía.</div>}
            {subs.map(s=>(
              <div key={s.name} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1,overflow:"hidden"}}>
                  <div style={{color:"white",fontWeight:700,fontSize:15}}>{s.name}</div>
                  <div style={{color:"rgba(255,255,255,0.3)",fontSize:11,marginTop:2}}>{new Date(s.timestamp).toLocaleDateString()} · {Object.values(s.groups||{}).filter(p=>p?.h!=null).length}/72</div>
                </div>
                <button onClick={()=>handlePaid(s.name,s.paid)} style={{padding:"8px 16px",borderRadius:10,border:s.paid?"1px solid rgba(74,222,128,0.4)":"1px solid rgba(255,255,255,0.1)",background:s.paid?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.05)",color:s.paid?"#4ade80":"rgba(255,255,255,0.4)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  {s.paid?"✓ Pagado":"Pendiente"}
                </button>
              </div>
            ))}
          </div>
        )}
        {tab==="results"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"rgba(59,130,246,0.07)",border:"1px solid rgba(59,130,246,0.18)",borderRadius:14,padding:14,color:"#93C5FD",fontSize:13}}>Introduce resultados conforme se juegan. El ranking se actualiza en tiempo real.</div>
            <h3 style={{color:"white",fontWeight:900,fontSize:18,textTransform:"uppercase",letterSpacing:2,margin:"4px 0"}}>Fase de Grupos</h3>
            {GROUPS.split("").map(g=>{
              const gms=MATCHES.map((m,i)=>[m,i]).filter(([m])=>m[0]===g)
              const fo=gms.filter(([_,i])=>off.groups?.[i]?.h!=null).length
              return (
                <details key={g} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,overflow:"hidden"}}>
                  <summary style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",cursor:"pointer",listStyle:"none"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:GCOL[g],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"white",fontSize:13,flexShrink:0}}>{g}</div>
                    <span style={{color:"white",fontWeight:700,flex:1}}>Grupo {g}</span>
                    <span style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>{fo}/6 ▾</span>
                  </summary>
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",padding:"4px 12px 12px"}}>
                    {gms.map(([mm,i])=>(<MatchRow key={i} idx={i} home={mm[2]} away={mm[3]} pred={off.groups?.[i]} onChange={handleGpOff}/>))}
                  </div>
                </details>
              )
            })}
            <h3 style={{color:"white",fontWeight:900,fontSize:18,textTransform:"uppercase",letterSpacing:2,margin:"4px 0"}}>Equipos por Ronda</h3>
            {ROUNDS.map(r=>{
              const cur=off.rounds?.[r]||[]; const f2=cur.filter(Boolean).length
              return (
                <details key={r} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,overflow:"hidden"}}>
                  <summary style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",cursor:"pointer",listStyle:"none"}}>
                    <span style={{color:ACCENT,fontWeight:700,fontSize:14,flex:1}}>{RN[r]}</span>
                    <span style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>{f2}/{RC[r]} ▾</span>
                  </summary>
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",padding:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {Array(RC[r]).fill(0).map((_,k)=>(
                      <TeamDD key={k} value={cur[k]||null} placeholder={`Equipo ${k+1}`} onChange={t=>{const a=[...cur];a[k]=t;setOff(o=>({...o,rounds:{...o.rounds,[r]:a}}))}}/>
                    ))}
                  </div>
                </details>
              )
            })}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:14}}>
              <h3 style={{color:"white",fontWeight:900,fontSize:16,textTransform:"uppercase",letterSpacing:2,margin:0}}>Bonus Final</h3>
              <div><label style={{color:"rgba(255,255,255,0.4)",fontSize:11,textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:8}}>🥇 Campeón</label><TeamDD value={off.champion||null} placeholder="Seleccionar campeón" onChange={t=>setOff(o=>({...o,champion:t}))}/></div>
              <div><label style={{color:"rgba(255,255,255,0.4)",fontSize:11,textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:8}}>🥉 Tercer puesto</label><TeamDD value={off.third||null} placeholder="Seleccionar tercero" onChange={t=>setOff(o=>({...o,third:t}))}/></div>
              <div><label style={{color:"rgba(255,255,255,0.4)",fontSize:11,textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:8}}>⚽ Máximo goleador</label>
                <input style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"12px 14px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}} placeholder="Nombre del pichichi" value={off.scorer||""} onChange={e=>setOff(o=>({...o,scorer:e.target.value}))}/>
              </div>
            </div>
            <button onClick={save} disabled={saving}
              style={{padding:"16px",borderRadius:14,background:ACCENT,color:"#000",fontWeight:900,fontSize:18,border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:2,opacity:saving?0.6:1}}>
              {saving?"GUARDANDO...":"💾 GUARDAR RESULTADOS"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen] = useState("hub")
  const [name,setName] = useState("")
  const go = n => { setName(n); setScreen("predict") }
  if (screen==="name")    return (<NameScreen onStart={go}/>)
  if (screen==="predict") return (<PredictScreen name={name} onDone={()=>setScreen("hub")}/>)
  if (screen==="ranking") return (<RankingScreen onBack={()=>setScreen("hub")}/>)
  if (screen==="admin")   return (<AdminScreen onBack={()=>setScreen("hub")}/>)
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:`radial-gradient(ellipse at 50% 0%,#0d2b0d 0%,${BG} 60%)`}}>
      <div style={{fontSize:70,marginBottom:16,filter:`drop-shadow(0 0 36px ${GLOW})`}}>🏆</div>
      <div style={{color:ACCENT,fontSize:13,fontWeight:700,letterSpacing:6,textTransform:"uppercase",marginBottom:4}}>👨‍👩‍👧‍👦 PORRA FAMILIA</div>
      <h1 style={{color:"white",fontWeight:900,fontSize:34,textTransform:"uppercase",letterSpacing:4,margin:"0 0 6px"}}>MUNDIAL 2026</h1>
      {name&&<p style={{color:"rgba(255,255,255,0.35)",fontSize:14,marginBottom:4}}>{name}</p>}
      <div style={{width:"100%",maxWidth:300,display:"flex",flexDirection:"column",gap:12,marginTop:32}}>
        {!name&&(<button onClick={()=>setScreen("name")} style={{padding:"17px",borderRadius:16,background:ACCENT,color:"#000",fontWeight:900,fontSize:18,border:"none",cursor:"pointer",letterSpacing:2,textTransform:"uppercase",boxShadow:`0 8px 30px ${GLOW}`}}>ENTRAR →</button>)}
        {name&&(<button onClick={()=>setScreen("predict")} style={{padding:"15px",borderRadius:14,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.13)",color:"white",fontWeight:700,fontSize:15,cursor:"pointer"}}>⚽ Mi pronóstico</button>)}
        <button onClick={()=>setScreen("ranking")} style={{padding:"16px",borderRadius:14,background:ACCENT,color:"#000",fontWeight:900,fontSize:18,border:"none",cursor:"pointer",letterSpacing:2,textTransform:"uppercase",boxShadow:`0 8px 30px ${GLOW}`}}>🏅 CLASIFICACIÓN</button>
        <button onClick={()=>setScreen("admin")} style={{padding:"12px",borderRadius:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.25)",fontWeight:600,fontSize:13,cursor:"pointer"}}>🔐 Admin</button>
        {name&&(<button onClick={()=>setScreen("name")} style={{padding:"9px",background:"none",border:"none",color:"rgba(255,255,255,0.18)",fontSize:12,cursor:"pointer"}}>Cambiar nombre</button>)}
      </div>
    </div>
  )
}

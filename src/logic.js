import { MATCHES, GROUPS, GTEAMS, R32S, ROUNDS, RC, SC } from './data.js'

export function computeStandings(gp) {
  const s = {}
  for (const g of GROUPS) {
    const st = Object.fromEntries(GTEAMS[g].map(t => [t, {pts:0,gf:0,gc:0}]))
    MATCHES.forEach(([gr,,h,a], i) => {
      if (gr!==g) return
      const p = gp[i]
      if (!p || p.h==null) return
      st[h].gf+=p.h; st[h].gc+=p.a; st[a].gf+=p.a; st[a].gc+=p.h
      if (p.h>p.a) st[h].pts+=3; else if (p.h<p.a) st[a].pts+=3; else { st[h].pts++; st[a].pts++ }
    })
    s[g] = GTEAMS[g].map(t=>({team:t,...st[t],dg:st[t].gf-st[t].gc})).sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf)
  }
  return s
}

export function getR32Auto(standings) {
  const pos = {}
  for (const g of GROUPS) {
    const o = standings[g]||[]
    pos[`1${g}`]=o[0]?.team; pos[`2${g}`]=o[1]?.team; pos[`3${g}`]=o[2]?.team
  }
  const thirds = GROUPS.split("").map((g,gi) => ({
    team: pos[`3${g}`]||null,
    pts: standings[g]?.[2]?.pts||0,
    dg: standings[g]?.[2]?.dg||0,
    gf: standings[g]?.[2]?.gf||0, gi
  })).sort((a,b)=>b.pts-a.pts||b.dg-a.dg||b.gf-a.gf)
  return R32S.flatMap(([cA,cB]) => [cA,cB].map(c => {
    if (c[0]==="1"||c[0]==="2") return pos[c]||null
    return thirds[parseInt(c[1])-1]?.team||null
  }))
}

export function getMatchTeams(round, mi, auto, picks) {
  if (round==="R32") return [auto[mi*2]||null, auto[mi*2+1]||null]
  const pr = ROUNDS[ROUNDS.indexOf(round)-1]
  return [(picks[pr]||[])[mi*2]||null, (picks[pr]||[])[mi*2+1]||null]
}

export function clearDownstream(picks, round, mi) {
  const np = {}
  ROUNDS.forEach(r => { np[r] = [...(picks[r]||Array(RC[r]).fill(null))] })
  let cm = mi
  for (let i=ROUNDS.indexOf(round)+1; i<ROUNDS.length; i++) {
    cm = Math.floor(cm/2)
    const a = [...np[ROUNDS[i]]]; a[cm]=null; np[ROUNDS[i]]=a
  }
  return np
}

export function getSFLoser(picks, idx) {
  const qf = picks.QF||[]
  const a=qf[idx*2]||null, b=qf[idx*2+1]||null
  const w=(picks.SF||[])[idx]
  if (w===a) return b; if (w===b) return a; return null
}

export function computeScore(pred, off) {
  let total=0, exact=0, sign=0
  MATCHES.forEach((_,i) => {
    const p=pred.groups?.[i], o=off.groups?.[i]
    if (!p||p.h==null||!o||o.h==null) return
    if (p.h===o.h&&p.a===o.a) { total+=SC.exact; exact++ }
    else if (Math.sign(p.h-p.a)===Math.sign(o.h-o.a)) { total+=SC.sign; sign++ }
  })
  const sets = {
    R32: pred.r32auto||[],
    R16: (pred.picks?.R32||[]).filter(Boolean),
    QF:  (pred.picks?.R16||[]).filter(Boolean),
    SF:  (pred.picks?.QF||[]).filter(Boolean),
    FN:  (pred.picks?.SF||[]).filter(Boolean),
  }
  ROUNDS.forEach(r => {
    const os = new Set(off.rounds?.[r]||[])
    ;(sets[r]||[]).forEach(t => { if (t&&os.has(t)) total+=SC[r] })
  })
  const pc = (pred.picks?.FN||[])[0]
  if (off.champion&&pc===off.champion) total+=SC.camp
  if (off.third&&pred.third===off.third) total+=SC.terc
  if (off.scorer&&pred.scorer&&pred.scorer.toLowerCase()===off.scorer.toLowerCase()) total+=SC.gol
  return {total, exact, sign}
}

export const EMPTY_PICKS = () => ({
  R32:Array(16).fill(null),R16:Array(8).fill(null),
  QF:Array(4).fill(null),SF:Array(2).fill(null),FN:Array(1).fill(null)
})

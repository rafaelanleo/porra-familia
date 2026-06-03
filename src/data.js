export const F = {"México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","República Checa":"🇨🇿","Canadá":"🇨🇦","Bosnia y Herzegovina":"🇧🇦","Catar":"🇶🇦","Suiza":"🇨🇭","Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴","Estados Unidos":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷","Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨","Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳","Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿","España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾","Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴","Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴","Portugal":"🇵🇹","RD Congo":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴","Inglaterra":"🏴","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦"}
export const ALL_TEAMS = Object.keys(F).sort()

export const MATCHES = [
  ["A","J1","México","Sudáfrica"],["A","J1","Corea del Sur","República Checa"],
  ["B","J1","Canadá","Bosnia y Herzegovina"],["B","J1","Catar","Suiza"],
  ["C","J1","Brasil","Marruecos"],["C","J1","Haití","Escocia"],
  ["D","J1","Estados Unidos","Paraguay"],["D","J1","Australia","Turquía"],
  ["E","J1","Alemania","Curazao"],["E","J1","Costa de Marfil","Ecuador"],
  ["F","J1","Países Bajos","Japón"],["F","J1","Suecia","Túnez"],
  ["G","J1","Bélgica","Egipto"],["G","J1","Irán","Nueva Zelanda"],
  ["H","J1","España","Cabo Verde"],["H","J1","Arabia Saudita","Uruguay"],
  ["I","J1","Francia","Senegal"],["I","J1","Irak","Noruega"],
  ["J","J1","Argentina","Argelia"],["J","J1","Austria","Jordania"],
  ["K","J1","Portugal","RD Congo"],["K","J1","Uzbekistán","Colombia"],
  ["L","J1","Inglaterra","Croacia"],["L","J1","Ghana","Panamá"],
  ["A","J2","República Checa","Sudáfrica"],["A","J2","México","Corea del Sur"],
  ["B","J2","Suiza","Bosnia y Herzegovina"],["B","J2","Canadá","Catar"],
  ["C","J2","Escocia","Marruecos"],["C","J2","Brasil","Haití"],
  ["D","J2","Estados Unidos","Australia"],["D","J2","Turquía","Paraguay"],
  ["E","J2","Alemania","Costa de Marfil"],["E","J2","Ecuador","Curazao"],
  ["F","J2","Países Bajos","Suecia"],["F","J2","Túnez","Japón"],
  ["G","J2","Bélgica","Irán"],["G","J2","Nueva Zelanda","Egipto"],
  ["H","J2","España","Arabia Saudita"],["H","J2","Uruguay","Cabo Verde"],
  ["I","J2","Francia","Irak"],["I","J2","Noruega","Senegal"],
  ["J","J2","Argentina","Austria"],["J","J2","Jordania","Argelia"],
  ["K","J2","Portugal","Uzbekistán"],["K","J2","Colombia","RD Congo"],
  ["L","J2","Inglaterra","Ghana"],["L","J2","Panamá","Croacia"],
  ["A","J3","República Checa","México"],["A","J3","Sudáfrica","Corea del Sur"],
  ["B","J3","Suiza","Canadá"],["B","J3","Bosnia y Herzegovina","Catar"],
  ["C","J3","Escocia","Brasil"],["C","J3","Marruecos","Haití"],
  ["D","J3","Turquía","Estados Unidos"],["D","J3","Paraguay","Australia"],
  ["E","J3","Curazao","Costa de Marfil"],["E","J3","Ecuador","Alemania"],
  ["F","J3","Japón","Suecia"],["F","J3","Túnez","Países Bajos"],
  ["G","J3","Egipto","Irán"],["G","J3","Nueva Zelanda","Bélgica"],
  ["H","J3","Cabo Verde","Arabia Saudita"],["H","J3","Uruguay","España"],
  ["I","J3","Noruega","Francia"],["I","J3","Senegal","Irak"],
  ["J","J3","Argelia","Austria"],["J","J3","Jordania","Argentina"],
  ["K","J3","Colombia","Portugal"],["K","J3","RD Congo","Uzbekistán"],
  ["L","J3","Panamá","Inglaterra"],["L","J3","Croacia","Ghana"],
]

export const GROUPS = "ABCDEFGHIJKL"
export const GTEAMS = {}
GROUPS.split("").forEach(g => {
  const s = new Set()
  MATCHES.filter(m => m[0]===g).forEach(m => { s.add(m[2]); s.add(m[3]) })
  GTEAMS[g] = [...s]
})
export const GCOL = {A:"#475569",B:"#991B1B",C:"#92400E",D:"#1E3A8A",E:"#9A3412",F:"#134E4A",G:"#14532D",H:"#155E75",I:"#4C1D95",J:"#9D174D",K:"#701A75",L:"#312E81"}
export const R32S = [["2A","2B"],["1E","T1"],["1F","2C"],["1C","2F"],["2E","2I"],["1I","T2"],["1A","T3"],["1L","T4"],["1G","T5"],["1D","T6"],["2K","2L"],["1H","2J"],["1B","T7"],["1K","T8"],["2D","2G"],["1J","2H"]]
export const ROUNDS = ["R32","R16","QF","SF","FN"]
export const RN = {R32:"Dieciseisavos",R16:"Octavos",QF:"Cuartos",SF:"Semifinales",FN:"Final"}
export const RC = {R32:16,R16:8,QF:4,SF:2,FN:1}
export const SC = {exact:3,sign:1,R32:1,R16:2,QF:3,SF:5,FN:8,camp:12,terc:6,gol:6}
export const ACCENT = "#F59E0B"
export const ADMIN_PW = "admin2026"

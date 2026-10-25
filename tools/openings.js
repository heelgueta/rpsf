const E=require('../docs/engine.js');const {makeSolver}=require('./solver.js');
const N=['rock','paper','scissors','foam'];
const v=process.argv[2]==='p2cut'?{bonus2:{c:1}}:{};
const s0=E.newState(v);const sv=makeSolver({});
for(const m of E.legalMoves(s0)){const o=E.applyMove(s0,m);const r=o.result!==null?(o.result===0?0:1):-sv.val(o.state);
 if(r>=0){const d=m.k==='atk'?`${N[m.from]} attacks ${N[m.to-4]}`:m.k==='rest'?`${N[m.from]} rests`:m.k==='sac'?`${N[m.from]} sacs into ${N[m.to]}`:`foam sac`; console.log(r>0?'WIN ':'DRAW',d,m.steal?JSON.stringify(m.steal):'');}}

const E=require('../docs/engine.js');const B=require('../docs/bots.js');const {makeSolver}=require('./solver.js');
const V={classic:{},rain:{bonus:{h:1}},glass:{bonus:{c:1}},fire:{bonus:{a:1}},
 'p2+1hp':{bonus2:{h:1}},'p2+1atk':{bonus2:{a:1}},'p2+1cut':{bonus2:{c:1}}};
const only=process.argv[2];
for(const [name,v] of Object.entries(V)){ if(only&&name!==only)continue;
 const s0=E.newState(v);const sv=makeSolver({order:(st,me)=>B.evaluate(st,me)});const t0=Date.now();
 const val=(s,o)=>o.result!==null?(o.result===0?0:o.result===s.turn+1?1:-1):(o.state.turn===s.turn?sv.val(o.state):-sv.val(o.state));
 let w=0,d=0,l=0;const moves=E.legalMoves(s0);
 for(const m of moves){const r=val(s0,E.applyMove(s0,m));if(r>0)w++;else if(r===0)d++;else l++;}
 console.log(name.padEnd(9),(w?'P1 WINS':d?'DRAW':'P2 WINS').padEnd(8),`openings: ${w}W/${d}D/${l}L of ${moves.length}`,'states',sv.memo.size,(Date.now()-t0)+'ms');}

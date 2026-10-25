const E=require('../docs/engine.js');const B=require('../docs/bots.js');const {makeSolver}=require('./solver.js');
const N=['rock','paper','scissors','foam'];
const V={classic:{},rain:{bonus:{h:1}},glass:{bonus:{c:1}},fire:{bonus:{a:1}},handicap:{p2cards:[{},{},{h:1},{h:1}]}};
for(const [name,base] of Object.entries(V)){
 for(const cb of [false,true]){
  const v=Object.assign({},base,{comeback:cb});const s0=E.newState(v);
  const sv=makeSolver({order:(st,me)=>B.evaluate(st,me)});const t0=Date.now();
  const val=(s,o)=>o.result!==null?(o.result===0?0:o.result===s.turn+1?1:-1):(o.state.turn===s.turn?sv.val(o.state):-sv.val(o.state));
  let w=0,d=0,l=0;const moves=E.legalMoves(s0);const wins=[];
  for(const m of moves){const r=val(s0,E.applyMove(s0,m));if(r>0){w++;wins.push(m)}else if(r===0)d++;else l++;}
  console.log((name+(cb?' +comeback':'')).padEnd(20),(w?'P1 WINS':d?'DRAW':'P2 WINS').padEnd(8),`openings ${w}W/${d}D/${l}L of ${moves.length}`,(Date.now()-t0)+'ms');
 }}

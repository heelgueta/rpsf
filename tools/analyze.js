const E=require('../docs/engine.js');const {makeSolver}=require('./solver.js');
const V={
 classic:{}, rain:{bonus:{h:1}}, glass:{bonus:{c:1}}, fire:{bonus:{a:1}},
 'p2+1hp':{bonus2:{h:1}}, 'p2+1atk':{bonus2:{a:1}}, 'p2+1cut':{bonus2:{c:1}},
 'rain p2+1hp':{bonus:{h:1},bonus2:{h:1}}, 'glass p2+1hp':{bonus:{c:1},bonus2:{h:1}}, 'fire p2+1hp':{bonus:{a:1},bonus2:{h:1}},
 'hp1':{hp:1}, 'hp3':{hp:3},
};
const only=process.argv[2];
for(const [name,v] of Object.entries(V)){ if(only&&name!==only) continue;
  const s0=E.newState(v); const sv=makeSolver({}); const t0=Date.now();
  let lim; try{
  const moves=E.legalMoves(s0); let w=0,d=0,l=0;
  for(const m of moves){const o=E.applyMove(s0,m); const r=o.result!==null?(o.result===0?0:o.result===1?1:-1):-sv.val(o.state); if(r>0)w++;else if(r===0)d++;else l++;}
  const best=w?'P1 WINS':d?'DRAW':'P2 WINS';
  console.log(name.padEnd(14),best.padEnd(8),`first moves: ${w} win/${d} draw/${l} lose of ${moves.length}`,'states',sv.memo.size,(Date.now()-t0)+'ms');
  }catch(e){console.log(name,'ERR',e.message)}
}

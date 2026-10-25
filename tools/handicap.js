const E=require('../docs/engine.js');const B=require('../docs/bots.js');const {makeSolver}=require('./solver.js');
const N=['rock','paper','scissors','foam'];
function solve(v){const s0=E.newState(v);const sv=makeSolver({order:(st,me)=>B.evaluate(st,me)});
 let w=0,d=0;for(const m of E.legalMoves(s0)){const o=E.applyMove(s0,m);const r=o.result!==null?(o.result===0?0:o.result===1?1:-1):(o.state.turn===s0.turn?sv.val(o.state):-sv.val(o.state));if(r>0)w++;else if(r===0)d++;}
 return {res:w?'P1':d?'DRAW':'P2',w,d};}
for(let k=0;k<4;k++)for(const a of ['h','a','c']){const p2=[{},{},{},{}];p2[k]={[a]:1};const r=solve({p2cards:p2});console.log(`P2 ${N[k]} +1${a}`.padEnd(18),r.res,`(P1 winning openings ${r.w}, drawing ${r.d})`);}
console.log('--- pairs');
const opts=[];for(let k=0;k<4;k++)for(const a of ['h','a','c'])opts.push([k,a]);
for(let i=0;i<opts.length;i++)for(let j=i+1;j<opts.length;j++){const p2=[{},{},{},{}];for(const [k,a] of [opts[i],opts[j]])p2[k][a]=(p2[k][a]||0)+1;const r=solve({p2cards:p2});if(r.res!=='P1')console.log(opts[i].join(''),opts[j].join(''),'->',r.res,r.w,r.d,JSON.stringify(p2));}

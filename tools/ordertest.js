const E=require('../docs/engine.js');const {makeSolver,VARIANTS}=require('./solver.js');const B=require('../docs/bots.js');
const name=process.argv[2]||'classic';
const order=(st,me)=>B.evaluate(st,me);
for(const [lab,o] of [['none',null],['eval',order]]){
  const sv=makeSolver({order:o});const t=Date.now();const v=sv.val(E.newState(VARIANTS[name]));
  console.log(name,lab,v,sv.memo.size,Date.now()-t+'ms');
}

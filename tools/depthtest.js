const B=require('../docs/bots.js');const E=require('../docs/engine.js');const {makeSolver,VARIANTS}=require('./solver.js');
const name=process.argv[2]||'classic';
for(const plies of [2,3,4,5,6]){
  let worst=0,tot=0,cnt=0,wst=0;
  for(let r=0;r<12;r++){
    let s=E.newState(VARIANTS[name]);let ok=true;
    for(let p=0;p<plies;p++){const m=E.legalMoves(s);const o=E.applyMove(s,m[Math.floor(Math.random()*m.length)]);if(o.result!==null){ok=false;break;}s=o.state;}
    if(!ok)continue;
    const sv=makeSolver({order:(st,me)=>B.evaluate(st,me)});const t=Date.now();sv.val(s);const dt=Date.now()-t;worst=Math.max(worst,dt);tot+=dt;cnt++;wst=Math.max(wst,sv.memo.size);
  }
  console.log(name,'plies',plies,'avg ms',Math.round(tot/cnt),'worst ms',worst,'worst states',wst);
}

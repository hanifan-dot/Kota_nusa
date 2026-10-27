(()=>{
  'use strict';
  if(window.NusaKebunSawit)return;
  let frame=null,busy=false,cloudPromise=null,cloudGardens=new Map();
  const CLOUD_PATH='nusaSawitGardensV267',LEGACY_PATH='nusaOrchardLotsV1';
  const style=document.createElement('style');
  style.textContent='#nusaKebunSawitFrame{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147482999;background:#8fd3f4}body.nusa-kebun-sawit-open{overflow:hidden!important;touch-action:none}';
  document.head.appendChild(style);

  function close(){
    if(!frame)return;
    frame.remove();frame=null;busy=false;
    document.body.classList.remove('nusa-kebun-sawit-open');
  }
  function open(){
    if(typeof state==='undefined'||!state.me){if(typeof toast==='function')toast('Masuk Kota Nusa dahulu.',true);return}
    if(frame)return;
    try{if(typeof closePanel==='function')closePanel()}catch(e){}
    document.body.classList.add('nusa-kebun-sawit-open');
    frame=document.createElement('iframe');frame.id='nusaKebunSawitFrame';frame.title='Kebun Sawit '+String(state.me.name||'Warga');
    frame.allow='autoplay';frame.src='kebun-sawit.html?embed=1&v=20261027-3';
    frame.onload=()=>{try{frame?.contentWindow?.KebunSawit?.buka({nama:'Kebun '+String(state.me?.name||'Warga')})}catch(e){close();toast('Kebun gagal dibuka. Muat ulang halaman.',true)}};
    document.body.appendChild(frame);
  }
  async function firebase(){
    if(cloudPromise)return cloudPromise;
    cloudPromise=(async()=>{const [A,B,D]=await window.NusaFirebaseSDK.load();const app=A.getApps().find(x=>x.name==='nusa-ktp-cloud');if(!app)throw Error('Firebase Kota Nusa belum siap. Buka KTP lalu hubungkan Google.');const auth=B.getAuth(app);if(typeof auth.authStateReady==='function')await auth.authStateReady();if(!auth.currentUser)await B.signInAnonymously(auth);return {B,D,auth,db:D.getDatabase(app)}})().catch(e=>{cloudPromise=null;throw e});
    return cloudPromise;
  }
  function safePalms(value,legacy=false){
    let rows=value;if(typeof rows==='string'){try{rows=JSON.parse(rows)}catch{return null}}
    if(!Array.isArray(rows)||rows.length>20)return null;const now=Date.now();
    return Array.from({length:20},(_,i)=>{const p=rows[i];if(legacy){const remaining=p?Math.max(0,(Number(p.nextAt)||now)-now):300000;return {plantedAt:now-(300000-Math.min(300000,remaining)),wAt:0,gold:p?.type==='emas'}}return p&&Number.isFinite(Number(p.plantedAt))?{plantedAt:Math.max(0,Number(p.plantedAt)),wAt:0,gold:!!p.gold}:null});
  }
  function cloudRow(key,r,source){
    if(!r||typeof r.name!=='string'||typeof r.gameId!=='string')return null;const palms=safePalms(source==='legacy'?r.trees:r.palms,source==='legacy');if(!palms)return null;const ready=palms.filter(p=>p&&Date.now()-p.plantedAt>=300000).length,gold=palms.filter(p=>p?.gold).length;return {id:source+':'+key,uid:String(r.uid||key),gameId:r.gameId,name:r.name.slice(0,24),gold,ready,palms,source};
  }
  async function listCloud(){
    const {D,db}=await firebase(),results=await Promise.allSettled([D.get(D.ref(db,CLOUD_PATH)),D.get(D.ref(db,LEGACY_PATH))]);cloudGardens.clear();const byGame=new Map();
    if(results[0].status==='fulfilled')for(const [key,r] of Object.entries(results[0].value.val()||{})){const row=cloudRow(key,r,'cloud');if(row){byGame.set(row.gameId,row);cloudGardens.set(row.id,row)}}
    if(results[1].status==='fulfilled')for(const [key,r] of Object.entries(results[1].value.val()||{})){const row=cloudRow(key,r,'legacy');if(row&&!byGame.has(row.gameId)){byGame.set(row.gameId,row);cloudGardens.set(row.id,row)}}
    if(!cloudGardens.size&&results.every(x=>x.status==='rejected'))throw Error('Daftar kebun online ditolak Firebase. Rules Kebun Sawit belum diterbitkan.');
    return [...cloudGardens.values()];
  }
  async function publishCloud(garden){
    try{const {D,auth,db}=await firebase(),u=auth.currentUser;if(!u||u.isAnonymous||!garden?.punya||!state.me?.id)return false;const palms=safePalms(garden.palms);if(!palms)return false;const rec={uid:u.uid,gameId:String(state.me.id).slice(0,64),name:String(state.me.name||'Warga').slice(0,24),color:/^#[0-9a-f]{6}$/i.test(state.me.color||'')?state.me.color:'#579b8b',palms:JSON.stringify(palms.map(p=>p?{plantedAt:p.plantedAt,gold:!!p.gold}:null)),updated:D.serverTimestamp()};await D.set(D.ref(db,CLOUD_PATH+'/'+u.uid),rec);return true}catch(e){console.info('Kebun Sawit online belum tersinkron:',e?.message||e);return false}
  }
  window.NusaSawitCloud={list:listCloud,publish:publishCloud};
  async function run(op,payload){
    if(op==='citizens'){
      let online=[];try{online=await listCloud()}catch(e){console.info(e.message||e)}
      const local=(state.citizens||[]).filter(p=>p.id!==state.me?.id&&p.sawitGarden?.punya).map(p=>({id:'local:'+p.id,gameId:p.id,name:p.name,gold:p.sawitGarden.gold||0,ready:p.sawitGarden.ready||0,palms:p.sawitGarden.palms,source:'local'}));
      const seen=new Set(online.map(x=>x.gameId)),rows=online.concat(local.filter(x=>!seen.has(x.gameId))).filter(x=>x.gameId!==state.me?.id);rows.forEach(x=>cloudGardens.set(x.id,x));return rows.map(({id,name,gold,ready})=>({id,name,gold,ready})).sort((a,b)=>a.name.localeCompare(b.name,'id'));
    }
    if(op==='visit'){
      let p=cloudGardens.get(String(payload.id||''));if(!p){await listCloud();p=cloudGardens.get(String(payload.id||''))}if(!p||!Array.isArray(p.palms))throw Error('Kebun warga ini belum tersedia online.');
      return {koin:Math.max(0,(state.me?.coins||0)-(state.me?.held||0)),punya:true,palms:p.palms,nama:'Kebun '+p.name,growMs:300000};
    }
    if(busy)throw Error('Tunggu proses kebun sebelumnya selesai.');
    busy=true;
    try{
      const body={op:op==='buy'?'buy':op==='harvest'?'harvest':op==='water'?'water':'state'};
      if(op==='harvest')body.ids=payload.ids;
      if(op==='water')body.id=payload.id;
      const data=await act('sawitGardenV267',body,true),garden=data.sawitGarden||data.state;void publishCloud(garden);
      if(op==='state')return garden;
      if(op==='buy')return {ok:true,state:garden};
      if(op==='harvest')return {ok:true,koin:Number(data.koin)||0,ids:data.ids||[],state:garden};
      return {ok:true,state:garden};
    }finally{busy=false}
  }
  window.addEventListener('message',async e=>{
    if(!frame||e.source!==frame.contentWindow)return;
    const d=e.data||{};
    if(d.type==='kebunsawit:keluar'){close();return}
    if(d.type!=='kebunsawit:request'||typeof d.id!=='string')return;
    try{const result=await run(String(d.op||''),d.payload||{});e.source.postMessage({type:'kebunsawit:response',id:d.id,result},location.origin)}
    catch(err){const msg=String(err?.message||err);if(['state','citizens','visit'].includes(d.op))e.source.postMessage({type:'kebunsawit:response',id:d.id,error:msg},location.origin);else e.source.postMessage({type:'kebunsawit:response',id:d.id,result:{ok:false,msg}},location.origin)}
  });
  window.NusaKebunSawit={open,close};
})();

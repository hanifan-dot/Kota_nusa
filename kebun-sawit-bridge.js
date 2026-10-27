(()=>{
  'use strict';
  if(window.NusaKebunSawit)return;
  let frame=null,busy=false;
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
    frame.allow='autoplay';frame.src='kebun-sawit.html?embed=1&v=20261027-2';
    frame.onload=()=>{try{frame?.contentWindow?.KebunSawit?.buka({nama:'Kebun '+String(state.me?.name||'Warga')})}catch(e){close();toast('Kebun gagal dibuka. Muat ulang halaman.',true)}};
    document.body.appendChild(frame);
  }
  async function run(op,payload){
    if(op==='citizens')return (state.citizens||[]).filter(p=>p.id!==state.me?.id&&p.sawitGarden?.punya).map(p=>({id:p.id,name:p.name,gold:p.sawitGarden.gold||0,ready:p.sawitGarden.ready||0})).sort((a,b)=>a.name.localeCompare(b.name,'id'));
    if(op==='visit'){
      const p=(state.citizens||[]).find(x=>x.id===String(payload.id||''));
      if(!p?.sawitGarden?.punya||!Array.isArray(p.sawitGarden.palms))throw Error('Kebun warga ini belum tersedia.');
      return {koin:Math.max(0,(state.me?.coins||0)-(state.me?.held||0)),punya:true,palms:p.sawitGarden.palms.map(x=>x?{plantedAt:Number(x.plantedAt)||0,wAt:0,gold:!!x.gold}:null),nama:'Kebun '+p.name,growMs:300000};
    }
    if(busy)throw Error('Tunggu proses kebun sebelumnya selesai.');
    busy=true;
    try{
      const body={op:op==='buy'?'buy':op==='harvest'?'harvest':op==='water'?'water':'state'};
      if(op==='harvest')body.ids=payload.ids;
      if(op==='water')body.id=payload.id;
      const data=await act('sawitGardenV267',body,true),garden=data.sawitGarden||data.state;
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

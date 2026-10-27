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
    frame.allow='autoplay';frame.src='kebun-sawit.html?embed=1&v=20261027-1';
    frame.onload=()=>{try{frame?.contentWindow?.KebunSawit?.buka({nama:'Kebun '+String(state.me?.name||'Warga')})}catch(e){close();toast('Kebun gagal dibuka. Muat ulang halaman.',true)}};
    document.body.appendChild(frame);
  }
  async function run(op,payload){
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
    catch(err){const msg=String(err?.message||err);if(d.op==='state')e.source.postMessage({type:'kebunsawit:response',id:d.id,error:msg},location.origin);else e.source.postMessage({type:'kebunsawit:response',id:d.id,result:{ok:false,msg}},location.origin)}
  });
  window.NusaKebunSawit={open,close};
})();

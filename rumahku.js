/* Rumahku: rendering rumah isometrik Canvas mengikuti level warga.
   Upgrade memakai dompet utama (situs resmi) atau simulasi lokal (Netlify tes). */
(()=>{'use strict';
const B=()=>window.NusaHomeBridge,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money=n=>Number(n||0).toLocaleString('id-ID');
const icons=['<path d="M16 28V14M16 20C5 20 4 12 4 9c9 0 12 4 12 11ZM16 15C16 7 22 4 29 4c0 7-5 12-13 11Z"/>','<path d="m5 22 16-17 7 7-16 17H5ZM18 8l7 7M5 29h23"/>','<path d="m3 15 13-12 13 12M7 12v17h18V12M16 25V13m-5 5 5-5 5 5"/>','<circle cx="12" cy="10" r="5"/><path d="M2 29v-4c0-10 20-10 20 0v4M22 5a5 5 0 0 1 0 10M25 20q5 1 5 9"/>'];
const seeds={sawit:{name:'Sawit',price:560,icon:'🌴'},apel:{name:'Apel',price:240,icon:'🍎'},mangga:{name:'Mangga',price:340,icon:'🥭'},jeruk:{name:'Jeruk',price:150,icon:'🍊'},pisang:{name:'Pisang',price:90,icon:'🍌'}};
let root=null,person=null,sheet=null,timer=null,previous=null,busy=false;
function me(){return B()?.player()}
function mine(){return person?.id===me()?.id}
function houseLevel(p){return Math.min(10,Math.max(0,Number(p?.personalHouseLevel||(p?.home!=null?Math.min(10,p.houseLevel||1):0))||0))}
function celebrity(p){return !!p?.id&&!!window.NusaCelebrity?.hasGameHome?.(p.id)}
function levels(){return B()?.levels?.()||[]}
function houseName(p){if(celebrity(p))return'Mansion Selebritis';const l=houseLevel(p);return levels().find(x=>Number(x.level)===l)?.name||('Rumah Level '+l)}
function current(){return mine()?me():person}
function closeSheet(){clearInterval(timer);timer=null;sheet?.remove();sheet=null;root?.querySelector('[data-rh="garden"]')?.focus()}
function close(){closeSheet();root?.remove();root=null;person=null;document.removeEventListener('keydown',keys);previous?.focus?.()}
function keys(e){if(e.key==='Escape'){e.preventDefault();sheet?closeSheet():close()}if(e.key==='Tab'){const scope=sheet||root;if(!scope)return;const a=[...scope.querySelectorAll('button:not(:disabled),input,select')].filter(x=>x.getClientRects().length);if(!a.length)return;const first=a[0],last=a[a.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}
function open(target){if(!me())return;previous=document.activeElement;close();person=target||me();root=document.createElement('section');root.id='rumahkuRoot';root.role='dialog';root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Rumahku');document.body.append(root);document.addEventListener('keydown',keys);render();root.querySelector('.rh-back').focus()}
function render(){if(!root)return;const p=current(),own=mine(),vip=celebrity(p),has=houseLevel(p)>0||vip;const name=B().identity(p).name,model=has?houseName(p):'';root.innerHTML=`<div class="rh-shell"><header class="rh-head"><button class="rh-back" aria-label="${own?'Kembali ke kota':'Kembali ke rumahku'}">‹</button><div class="rh-title"><h1>${own?'Rumahku':'Bertamu'}</h1><small>Rumah ${esc(name)}</small></div><button class="rh-share" aria-label="Bagikan Kota Nusa">↥</button></header><div class="rh-meta">${vip?'✦ Rumah Selebritis · '+esc(model):has?'Rumah pribadi · Level '+houseLevel(p)+' / 10 · '+esc(model):'Belum punya rumah pribadi'}</div><div class="rh-scene" data-house-level="${houseLevel(p)}" data-house-model="${esc(model)}" data-house-celebrity="${vip?'true':'false'}" data-house-decor="${esc(p.decor||'sage')}"><img src="assets/rumahku-reference.png" alt="Ilustrasi halaman rumah low-poly, pagar hijau, pohon dan kebun empat petak" width="864" height="1536" draggable="false"><div class="rh-paint" style="background:${({coral:'#e3ad94',blue:'#a8cbd8',sand:'#e4d0a8'})[p.decor]||'transparent'}"></div>${own?'<button class="rh-hotspot" data-rh="garden" aria-label="Buka empat petak kebun">Kebun</button>':''}</div><footer class="rh-deck"><nav class="rh-dock" aria-label="Menu rumah">${['Kebun','Hias','Upgrade','Kunjungi'].map((n,i)=>`<button data-rh="${['garden','decor','upgrade','visit'][i]}" ${!own&&i<3?'disabled':''}><i><svg viewBox="0 0 32 32" aria-hidden="true">${icons[i]}</svg></i><span>${n}</span></button>`).join('')}</nav></footer></div>`;

root.querySelector('.rh-back').onclick=()=>own?close():window.NusaRumahku.open();root.querySelector('.rh-share').onclick=async()=>{try{await navigator.share({title:'Kota Nusa',text:'Kunjungi rumah '+name+' di Kota Nusa!',url:location.href.split('#')[0]})}catch(e){if(e.name==='AbortError')return;try{await navigator.clipboard.writeText(location.href.split('#')[0]);B().toast('Tautan Kota Nusa disalin.')}catch{B().toast('Bagikan alamat game dari browser.')}}};root.querySelectorAll('[data-rh]').forEach(b=>b.onclick=()=>({garden,decor,upgrade,visit}[b.dataset.rh])());enableHorizontalPan();}

/* Kamera geser kanan/kiri di halaman Rumahku. Tidak mengubah dunia, level, saldo,
   hak Premium, atau logika ketukan untuk berjalan. */
let housePan=0;
function enableHorizontalPan(){
 const scene=root?.querySelector('.rh-scene');
 if(!scene||scene.dataset.panReady==='1')return;
 scene.dataset.panReady='1';
 scene.setAttribute('aria-label','Halaman rumah. Geser ke kanan atau kiri untuk melihat sisi halaman; ketuk tanah untuk berjalan.');
 const apply=()=>{
  const cv=scene.querySelector('.rh-stage2-canvas')||scene.querySelector('.rh-stage1-canvas');
  if(!cv)return;
  const extra=Math.max(0,(cv.getBoundingClientRect().width-scene.clientWidth)/2);
  housePan=Math.max(-extra,Math.min(extra,housePan));
  scene.style.setProperty('--rh-pan-x',housePan+'px');
 };
 let drag=null;
 scene.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||e.target.closest('button'))return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:housePan,startScroll:scene.scrollTop,mode:null};
  try{scene.setPointerCapture(e.pointerId)}catch(_){}
 },{passive:true});
 scene.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.mode&&Math.hypot(dx,dy)>8)drag.mode=Math.abs(dx)>Math.abs(dy)?'horizontal':'vertical';
  if(!drag.mode)return;
  if(drag.mode==='vertical'){
   scene.scrollTop=Math.max(0,drag.startScroll-dy);
   scene.classList.add('rh-camera-used');
   return;
  }
  const cv=scene.querySelector('.rh-stage2-canvas')||scene.querySelector('.rh-stage1-canvas');
  const extra=cv?Math.max(0,(cv.getBoundingClientRect().width-scene.clientWidth)/2):0;
  housePan=Math.max(-extra,Math.min(extra,drag.start+dx));
  scene.style.setProperty('--rh-pan-x',housePan+'px');
  scene.classList.add('rh-camera-used');
 },{passive:true});
 const end=e=>{if(drag && (!e||e.pointerId===drag.id))drag=null;};
 scene.addEventListener('pointerup',end,{passive:true});
 scene.addEventListener('pointercancel',end,{passive:true});
 window.requestAnimationFrame(apply);
}
function panel(title,html){closeSheet();sheet=document.createElement('div');sheet.className='rh-sheet';sheet.innerHTML=`<article role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button aria-label="Tutup menu">×</button></header>${html}<p class="rh-msg" role="status"></p></article>`;root.append(sheet);sheet.querySelector('header button').onclick=closeSheet;sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});sheet.querySelector('header button').focus();return sheet}
function msg(s){const e=sheet?.querySelector('.rh-msg');if(e)e.textContent=s}
async function run(button,action,done){if(busy)return;busy=true;button.disabled=true;try{const r=await action();done(r)}catch(e){msg(e.message||'Belum berhasil. Coba lagi.')}finally{busy=false;if(button.isConnected)button.disabled=false}}
function cropStage(c,now=Date.now()){if(!c)return null;const start=Number(c.plantedAt)||now,end=Math.max(start+1,Number(c.nextAt)||start+1),progress=Math.max(0,Math.min(1,(now-start)/(end-start)));return progress>=1?{key:'ready',label:'Siap panen',progress:100}:progress<.28?{key:'seed',label:'Bibit',progress:Math.round(progress*100)}:{key:'grow',label:'Tumbuh',progress:Math.round(progress*100)}}
function garden(){const p=me(),plots=p.privateGardenV262?.plots||Array(5).fill(null);const q=panel('Kebun · 4 petak',`<small>Empat petak depan dari Kebunku. Saldo: ${money(p.coins-p.held)} koin.</small><div class="rh-grid">${Array.from({length:4},(_,i)=>{const c=plots[i],s=seeds[c?.type],stage=cropStage(c);return `<div class="rh-card" ${c?`data-crop-card="${i}" data-stage="${stage.key}"`:''}><b>${s?.icon||'🌱'} Petak ${i+1}</b><span>${s?.name||'Kosong'}</span>${c?`<div class="rh-crop-visual" aria-hidden="true"><i></i><b>${stage.key==='ready'?(s?.icon||'🌳'):'🌱'}</b></div><small data-ready="${Number(c.nextAt)}" data-planted="${Number(c.plantedAt)||0}"></small><div class="rh-growbar" aria-hidden="true"><i style="width:${stage.progress}%"></i></div>`:`<select aria-label="Bibit petak ${i+1}" data-seed="${i}">${Object.entries(seeds).map(([k,v])=>`<option value="${k}">${v.name} · ${money(v.price)}</option>`).join('')}</select><button data-plant="${i}">Tanam</button>`}</div>`}).join('')}</div><button class="rh-wide" id="rhHarvest">Panen yang matang</button><button class="rh-wide" id="rhAllGarden">Lihat kebun lengkap & petak ke-5</button><small>Empat petak ini memakai progres Kebunku yang tersimpan. Tanaman berubah dari bibit, tumbuh, lalu siap panen; panen mencakup semua petak yang matang.</small>`);const tick=()=>{const now=Date.now();q.querySelectorAll('[data-ready]').forEach(e=>{const c={plantedAt:Number(e.dataset.planted),nextAt:Number(e.dataset.ready)},stage=cropStage(c,now),card=e.closest('[data-crop-card]');e.textContent=stage.key==='ready'?'✅ Siap dipanen':stage.label+' · '+Math.max(1,Math.ceil((c.nextAt-now)/60000))+' menit lagi';if(card){card.dataset.stage=stage.key;card.querySelector('.rh-growbar i').style.width=stage.progress+'%'}});q.querySelector('#rhHarvest').disabled=!plots.some(c=>c&&now>=c.nextAt)};tick();timer=setInterval(tick,10000);q.querySelectorAll('[data-plant]').forEach(b=>b.onclick=()=>run(b,()=>window.NusaGardenActionV262('plant',{plot:Number(b.dataset.plant),type:q.querySelector(`[data-seed="${b.dataset.plant}"]`).value}),()=>{garden();msg('Bibit ditanam.')}));q.querySelector('#rhHarvest').onclick=e=>run(e.currentTarget,()=>window.NusaGardenActionV262('harvest'),r=>{garden();msg('Panen berhasil · +'+money(r.harvestGain)+' koin.')});q.querySelector('#rhAllGarden').onclick=()=>{close();window.NusaGarden262.openGarden()};}
function decor(){const p=current();if(celebrity(p)){panel('Hias Rumah Selebritis','<p>Desain putih–hitam mansion premium sudah menjadi ciri khusus Rumah Selebritis.</p><small>Fitur dekorasi khusus selebritis akan ditambahkan terpisah agar bentuk mansion tidak berubah menjadi rumah biasa.</small>');return}if(!houseLevel(p)){panel('Hias rumah','<p>Beli rumah Level 1 dahulu untuk menghias rumah pribadimu.</p><button class="rh-wide" id="rhLand">Beli rumah Level 1</button>').querySelector('#rhLand').onclick=()=>{closeSheet();upgrade()};return}const q=panel('Hias rumah',`<p>Ganti warna rumah · <b>${window.NusaRumahkuTest?.enabled?'25 koin (simulasi)':'25 koin'}</b> per perubahan.</p><small>${window.NusaRumahkuTest?.enabled?'Mode TES: warna disimpan lokal; saldo asli tidak berkurang.':'Saldo tersedia '+money(p.coins-p.held)+' koin.'}</small><div class="rh-grid">${[['sage','Hijau'],['coral','Koral'],['blue','Biru'],['sand','Pasir']].map(([v,n])=>`<button data-color="${v}" ${v===p.decor?'disabled':''}>${n}${v===p.decor?' ✓':''}</button>`).join('')}</div>`);q.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{const color=b.dataset.color;panel('Konfirmasi warna',`<p>${window.NusaRumahkuTest?.enabled?'Simulasi warna (saldo asli tidak berkurang)':'Gunakan 25 koin'} untuk warna ${esc(b.textContent)}?</p><button class="rh-wide" id="rhPaintConfirm">${window.NusaRumahkuTest?.enabled?'Terapkan warna TES':'Bayar 25 koin & terapkan'}</button>`).querySelector('#rhPaintConfirm').onclick=e=>run(e.currentTarget,()=>B().decorate(color),()=>{closeSheet();render();decor();msg('Warna rumah tersimpan.')} )});}
async function upgrade(){
 // Satu ketukan pada tombol Upgrade langsung memproses tingkat berikutnya.
 // Daftar level tetap tersedia di <details> di layar Rumahku.
 if(busy||!mine())return;
 const p=current(),currentLevel=houseLevel(p),next=levels()[currentLevel];
 if(celebrity(p)){B()?.toast?.('✦ Rumah Selebritis sudah menjadi kelas rumah tertinggi.');return;}
 if(!next){B()?.toast?.('Rumah sudah mencapai Level 10.');return;}
 const demo=!!window.NusaRumahkuTest?.enabled;
 const available=Number(p.coins||0)-Number(p.held||0);
 if(!demo&&available<next.price){B()?.toast?.('Koin belum cukup. Kurang '+money(next.price-available)+' koin.',true);return;}
 const summary=(currentLevel===0?'Beli rumah pertama':'Upgrade rumah ke Level '+next.level)+
   '\n'+next.name+' — '+money(next.price)+' koin'+
   '\n'+next.desc+
   '\n\n'+(demo?'SIMULASI: saldo asli tidak dipotong.':'Biaya dipotong dari dompet Kota Nusa.');
 if(!window.confirm(summary))return;
 busy=true;
 const buttons=[...root.querySelectorAll('[data-rh="upgrade"]')];
 for(const b of buttons){b.disabled=true;b.setAttribute('aria-busy','true');b.dataset.label=b.textContent;b.textContent='Memproses…';}
 try{
  const result=currentLevel===0?await B().buyHouse():await B().upgradeHouse(currentLevel);
  // Verifikasi bahwa level benar-benar berubah sebelum memberi notifikasi sukses.
  const actual=houseLevel(current());
  const returned=houseLevel(result?.me);
  if(actual!==next.level&&returned!==next.level){
   throw new Error('Level belum berubah. Coba muat ulang Rumahku sebelum mengulang pembayaran.');
  }
  // Render ulang halaman dan kedua lapis Canvas setelah level diperbarui.
  render();
  window.NusaRumahkuVisual?.refresh?.();
  const stage=root?.querySelector('.rh-scene');
  if(stage){
   stage.classList.remove('rh-house-level-up');
   void stage.offsetWidth;
   stage.classList.add('rh-house-level-up');
  }
  B()?.toast?.('🏡 '+next.name+' berhasil! Rumah sekarang Level '+actual+'.');
 }catch(e){
  B()?.toast?.(e?.message||'Pembelian atau upgrade belum berhasil.',true);
 }finally{
  busy=false;
  for(const b of buttons)if(b.isConnected){b.disabled=false;b.removeAttribute('aria-busy');if(b.dataset.label)b.textContent=b.dataset.label;}
 }
}
function visit(){
 const q=panel('Kunjungi rumah',`<input class="rh-search" aria-label="Cari nama KTP warga" placeholder="Cari nama KTP warga…"><div id="rhPeople"></div><small>Semua rumah, termasuk Rumah Selebritis, dibuka langsung lewat Rumahku.</small>`);
 const draw=()=>{
  const search=q.querySelector('input').value.trim().toLocaleLowerCase('id-ID');
  const nameFor=p=>String(B().identity(p)?.name||p.name||'');
  const people=B().citizens().filter(p=>p.id!==me().id&&(houseLevel(p)>0||window.NusaCelebrity?.hasGameHome?.(p.id))&&(nameFor(p)+' '+String(p.name||'')).toLocaleLowerCase('id-ID').includes(search));
  const list=q.querySelector('#rhPeople');
  list.innerHTML=people.length?people.map(p=>{const celebrity=window.NusaCelebrity?.hasGameHome?.(p.id);return `<div class="rh-person"><span>${esc(nameFor(p))}<small>${B().isOnline?.(p.id)?'● Online · ':''}${esc(B().identity(p).addr)} · ${celebrity?'✦ Rumah Selebritis':'Level '+houseLevel(p)}</small></span><button data-person="${esc(p.id)}">Kunjungi</button></div>`}).join(''):'<p>Belum ada rumah warga yang cocok.</p>';
  list.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>{const target=people.find(p=>String(p.id)===b.dataset.person);if(target)window.NusaRumahku.open(target)});
 };
 q.querySelector('input').oninput=draw;draw();
}
window.NusaRumahku={open,close,displayed:()=>current()};
})();

/* Personal house entry. Reuses the existing KTP identity, wallet actions and garden.
   The reference illustration is deliberately fixed; actual level is shown separately. */
(()=>{'use strict';
const B=()=>window.NusaHomeBridge,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money=n=>Number(n||0).toLocaleString('id-ID');
const icons=['<path d="M16 28V14M16 20C5 20 4 12 4 9c9 0 12 4 12 11ZM16 15C16 7 22 4 29 4c0 7-5 12-13 11Z"/>','<path d="m5 22 16-17 7 7-16 17H5ZM18 8l7 7M5 29h23"/>','<path d="m3 15 13-12 13 12M7 12v17h18V12M16 25V13m-5 5 5-5 5 5"/>','<circle cx="12" cy="10" r="5"/><path d="M2 29v-4c0-10 20-10 20 0v4M22 5a5 5 0 0 1 0 10M25 20q5 1 5 9"/>'];
const seeds={sawit:{name:'Sawit',price:560,icon:'🌴'},apel:{name:'Apel',price:240,icon:'🍎'},mangga:{name:'Mangga',price:340,icon:'🥭'},jeruk:{name:'Jeruk',price:150,icon:'🍊'},pisang:{name:'Pisang',price:90,icon:'🍌'}};
let root=null,person=null,sheet=null,timer=null,previous=null,busy=false;
function me(){return B()?.player()}
function mine(){return person?.id===me()?.id}
function houseLevel(p){return Math.min(10,Math.max(0,Number(p?.personalHouseLevel||(p?.home!=null?Math.min(10,p.houseLevel||1):0))||0))}
function levels(){return B()?.levels?.()||[]}
function current(){return mine()?me():person}
function closeSheet(){clearInterval(timer);timer=null;sheet?.remove();sheet=null;root?.querySelector('[data-rh="garden"]')?.focus()}
function close(){closeSheet();root?.remove();root=null;person=null;document.removeEventListener('keydown',keys);previous?.focus?.()}
function keys(e){if(e.key==='Escape'){e.preventDefault();sheet?closeSheet():close()}if(e.key==='Tab'){const scope=sheet||root;if(!scope)return;const a=[...scope.querySelectorAll('button:not(:disabled),input,select')].filter(x=>x.getClientRects().length);if(!a.length)return;const first=a[0],last=a[a.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}
function open(target){if(!me())return;previous=document.activeElement;close();person=target||me();root=document.createElement('section');root.id='rumahkuRoot';root.role='dialog';root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Rumahku');document.body.append(root);document.addEventListener('keydown',keys);render();root.querySelector('.rh-back').focus()}
function render(){if(!root)return;const p=current(),own=mine(),has=houseLevel(p)>0;const name=B().identity(p).name;root.innerHTML=`<div class="rh-shell"><header class="rh-head"><button class="rh-back" aria-label="${own?'Kembali ke kota':'Kembali ke rumahku'}">‹</button><div class="rh-title"><h1>${own?'Rumahku':'Bertamu'}</h1><small>Rumah ${esc(name)}</small></div><button class="rh-share" aria-label="Bagikan Kota Nusa">↥</button></header><div class="rh-meta">${has?'Rumah pribadi · Level '+houseLevel(p)+' / 10':'Belum punya rumah pribadi'}</div><div class="rh-scene" data-house-level="${houseLevel(p)}" data-house-decor="${esc(p.decor||'sage')}"><img src="assets/rumahku-reference.png" alt="Ilustrasi halaman rumah low-poly, pagar hijau, pohon dan kebun empat petak" width="864" height="1536" draggable="false"><div class="rh-paint" style="background:${({coral:'#e3ad94',blue:'#a8cbd8',sand:'#e4d0a8'})[p.decor]||'transparent'}"></div>${own?'<button class="rh-hotspot" data-rh="garden" aria-label="Buka empat petak kebun">Kebun</button>':''}</div><footer class="rh-deck"><nav class="rh-dock" aria-label="Menu rumah">${['Kebun','Hias','Upgrade','Kunjungi'].map((n,i)=>`<button data-rh="${['garden','decor','upgrade','visit'][i]}" ${!own&&i<3?'disabled':''}><i><svg viewBox="0 0 32 32" aria-hidden="true">${icons[i]}</svg></i><span>${n}</span></button>`).join('')}</nav></footer></div>`;
// Info level bisa dibuka dalam layar Rumahku tanpa berpindah ke peta.
const holder=document.createElement('section');
holder.className='rh-progression';
holder.style.cssText='color:#254534;background:#e9f2e7;border:1px solid #bdd3bc;border-radius:16px;margin:6px 18px 4px;padding:12px;font-size:13px';
const ownLevel=houseLevel(p),next=levels()[ownLevel],level=levels()[Math.max(0,ownLevel-1)];
holder.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><b>'+(ownLevel?'🏡 Level '+ownLevel+' · '+esc(level?.name||'Rumah'):'🏡 Belum memiliki rumah')+'</b><span>'+(ownLevel>=10?'MAX':ownLevel?'Lv.'+(ownLevel+1):'Mulai dari 500 koin')+'</span></div>'+
 '<p style="margin:5px 0;color:#4c6856">'+esc(ownLevel?(level?.desc||'Rumah pribadi'):'Beli rumah Level 1 tanpa perlu lahan atau kavling di peta.')+'</p>'+
 (own?'<button type="button" data-rh="upgrade" '+(ownLevel>=10?'disabled':'')+' style="border:0;padding:9px 12px;background:#1d6047;color:#fff;border-radius:10px;width:100%;font-weight:700;margin:5px 0;cursor:pointer">'+(ownLevel===0?'Beli rumah Level 1 · 500 koin':next?'Upgrade sekarang → '+esc(next.name)+' · '+money(next.price)+' koin':'✓ Rumah sudah Level 10')+'</button>':'')+
 '<details style="margin-top:8px"><summary style="cursor:pointer;font-weight:700">Lihat nama, deskripsi & harga Level 1–10</summary><div style="max-height:195px;overflow:auto;margin-top:7px">'+
 levels().map(v=>'<div style="padding:9px 2px;border-bottom:1px solid #c9ddca"><b>Lv.'+v.level+' · '+esc(v.name)+'</b><span style="float:right;font-weight:700">'+money(v.price)+' koin</span><div style="font-size:12px;clear:both;color:#456453">'+esc(v.desc)+'</div></div>').join('')+
 '</div></details>';
root.querySelector('.rh-deck')?.before(holder);
root.querySelector('.rh-back').onclick=()=>own?close():open();root.querySelector('.rh-share').onclick=async()=>{try{await navigator.share({title:'Kota Nusa',text:'Kunjungi rumah '+name+' di Kota Nusa!',url:location.href.split('#')[0]})}catch(e){if(e.name==='AbortError')return;try{await navigator.clipboard.writeText(location.href.split('#')[0]);B().toast('Tautan Kota Nusa disalin.')}catch{B().toast('Bagikan alamat game dari browser.')}}};root.querySelectorAll('[data-rh]').forEach(b=>b.onclick=()=>({garden,decor,upgrade,visit}[b.dataset.rh])());}
function panel(title,html){closeSheet();sheet=document.createElement('div');sheet.className='rh-sheet';sheet.innerHTML=`<article role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button aria-label="Tutup menu">×</button></header>${html}<p class="rh-msg" role="status"></p></article>`;root.append(sheet);sheet.querySelector('header button').onclick=closeSheet;sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});sheet.querySelector('header button').focus();return sheet}
function msg(s){const e=sheet?.querySelector('.rh-msg');if(e)e.textContent=s}
async function run(button,action,done){if(busy)return;busy=true;button.disabled=true;try{const r=await action();done(r)}catch(e){msg(e.message||'Belum berhasil. Coba lagi.')}finally{busy=false;if(button.isConnected)button.disabled=false}}
function garden(){const p=me(),plots=p.privateGardenV262?.plots||Array(5).fill(null);const q=panel('Kebun · 4 petak',`<small>Empat petak depan dari Kebunku. Saldo: ${money(p.coins-p.held)} koin.</small><div class="rh-grid">${Array.from({length:4},(_,i)=>{const c=plots[i],s=seeds[c?.type];return `<div class="rh-card"><b>${s?.icon||'🌱'} Petak ${i+1}</b><span>${s?.name||'Kosong'}</span>${c?`<small data-ready="${Number(c.nextAt)}"></small>`:`<select aria-label="Bibit petak ${i+1}" data-seed="${i}">${Object.entries(seeds).map(([k,v])=>`<option value="${k}">${v.name} · ${money(v.price)}</option>`).join('')}</select><button data-plant="${i}">Tanam</button>`}</div>`}).join('')}</div><button class="rh-wide" id="rhHarvest">Panen yang matang</button><button class="rh-wide" id="rhAllGarden">Lihat kebun lengkap & petak ke-5</button><small>Tanaman dan hasil panen memakai progres Kebunku yang sudah ada di browser ini. Panen mencakup semua petak matang. Ilustrasi halaman tetap mengikuti referensi; keadaan tanaman ditampilkan di kartu petak.</small>`);const tick=()=>{q.querySelectorAll('[data-ready]').forEach(e=>e.textContent=Date.now()>=Number(e.dataset.ready)?'Siap dipanen':'Tumbuh · '+Math.ceil((Number(e.dataset.ready)-Date.now())/60000)+' menit lagi');q.querySelector('#rhHarvest').disabled=!plots.some(c=>c&&Date.now()>=c.nextAt)};tick();timer=setInterval(tick,10000);q.querySelectorAll('[data-plant]').forEach(b=>b.onclick=()=>run(b,()=>window.NusaGardenActionV262('plant',{plot:Number(b.dataset.plant),type:q.querySelector(`[data-seed="${b.dataset.plant}"]`).value}),()=>{garden();msg('Bibit ditanam.')}));q.querySelector('#rhHarvest').onclick=e=>run(e.currentTarget,()=>window.NusaGardenActionV262('harvest'),r=>{garden();msg('Panen berhasil · +'+money(r.harvestGain)+' koin.')});q.querySelector('#rhAllGarden').onclick=()=>{close();window.NusaGarden262.openGarden()};}
function decor(){const p=current();if(!houseLevel(p)){panel('Hias rumah','<p>Beli rumah Level 1 dahulu untuk menghias rumah pribadimu.</p><button class="rh-wide" id="rhLand">Beli rumah Level 1</button>').querySelector('#rhLand').onclick=()=>{closeSheet();upgrade()};return}const q=panel('Hias rumah',`<p>Ganti warna rumah · <b>${window.NusaRumahkuTest?.enabled?'25 koin (simulasi)':'25 koin'}</b> per perubahan.</p><small>${window.NusaRumahkuTest?.enabled?'Mode TES: warna disimpan lokal; saldo asli tidak berkurang.':'Saldo tersedia '+money(p.coins-p.held)+' koin.'}</small><div class="rh-grid">${[['sage','Hijau'],['coral','Koral'],['blue','Biru'],['sand','Pasir']].map(([v,n])=>`<button data-color="${v}" ${v===p.decor?'disabled':''}>${n}${v===p.decor?' ✓':''}</button>`).join('')}</div>`);q.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{const color=b.dataset.color;panel('Konfirmasi warna',`<p>${window.NusaRumahkuTest?.enabled?'Simulasi warna (saldo asli tidak berkurang)':'Gunakan 25 koin'} untuk warna ${esc(b.textContent)}?</p><button class="rh-wide" id="rhPaintConfirm">${window.NusaRumahkuTest?.enabled?'Terapkan warna TES':'Bayar 25 koin & terapkan'}</button>`).querySelector('#rhPaintConfirm').onclick=e=>run(e.currentTarget,()=>B().decorate(color),()=>{closeSheet();render();decor();msg('Warna rumah tersimpan.')} )});}
async function upgrade(){
 // Satu ketukan pada tombol Upgrade langsung memproses tingkat berikutnya.
 // Daftar level tetap tersedia di <details> di layar Rumahku.
 if(busy||!mine())return;
 const p=current(),currentLevel=houseLevel(p),next=levels()[currentLevel];
 if(!next){B()?.toast?.('Rumah sudah mencapai Level 10.');return;}
 const demo=!!window.NusaRumahkuTest?.enabled;
 const summary=(currentLevel===0?'Beli rumah pertama':'Upgrade rumah ke Level '+next.level)+
   '\n'+next.name+' — '+money(next.price)+' koin'+
   '\n'+next.desc+
   '\n\n'+(demo?'SIMULASI: saldo asli tidak dipotong.':'Biaya dipotong dari dompet Kota Nusa.');
 if(!window.confirm(summary))return;
 busy=true;
 const buttons=[...root.querySelectorAll('[data-rh="upgrade"]')];
 for(const b of buttons)b.disabled=true;
 try{
  if(currentLevel===0)await B().buyHouse();
  else await B().upgradeHouse(currentLevel);
  // Ambil level terbaru setelah transaksi / simulasi; ganti kanvas saat itu juga.
  render();
  B()?.toast?.('🏡 '+next.name+' berhasil! Rumah sekarang Level '+next.level+'.');
 }catch(e){
  B()?.toast?.(e?.message||'Pembelian atau upgrade belum berhasil.',true);
 }finally{
  busy=false;
  for(const b of buttons)if(b.isConnected)b.disabled=false;
 }
}
function visit(){const q=panel('Kunjungi rumah',`<input class="rh-search" aria-label="Cari nama KTP warga" placeholder="Cari nama KTP warga…"><div id="rhPeople"></div><small>Hanya warga yang sudah memiliki rumah. Rumah pribadi mengikuti level warga. Sistem kavling peta tidak diperlukan.</small>`);const draw=()=>{const search=q.querySelector('input').value.toLocaleLowerCase();const people=B().citizens().filter(p=>p.id!==me().id&&houseLevel(p)>0&&String(p.name).toLocaleLowerCase().includes(search));const list=q.querySelector('#rhPeople');list.innerHTML=people.length?people.map(p=>`<div class="rh-person"><span>${esc(p.name)}<small>${esc(B().identity(p).addr)} · Level ${houseLevel(p)}</small></span><button data-person="${esc(p.id)}">Kunjungi</button></div>`).join(''):'<p>Belum ada rumah warga yang cocok.</p>';list.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>open(people.find(p=>p.id===b.dataset.person)))};q.querySelector('input').oninput=draw;draw()}
window.NusaRumahku={open,close};
})();

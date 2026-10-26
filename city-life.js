/* Kota Nusa — Kota Hidup: NPC-only mini activities.
   These are scripted NPCs, NOT Firebase player presence; awards are local cosmetic progress.
   Does not create/alter wallet balances, orders, player roles or online counts. */
(()=>{'use strict';
const KEY='nusa-citylife-local-v1';
const NP=[{name:'Bu Sari',role:'Pedagang Pasar',emoji:'🧕',line:'Lapak sudah buka. Bantu aku melayani pesanan?'},{name:'Pak Budi',role:'Kurir',emoji:'🧑‍✈️',line:'Paket harus sampai sesuai alamat. Bantu pilih jalan!'},{name:'Rani',role:'Petugas Taman',emoji:'👩‍🌾',line:'Lampu taman harus dinyalakan dengan urutan tepat.'},{name:'Dika',role:'Montir',emoji:'🧑‍🔧',line:'Bengkel sudah siap melayani warga.'},{name:'Pak Joko',role:'Penjaga Kota',emoji:'👮',line:'Kota aman, warga bisa beraktivitas.'}];
const SHOPS=[
 {npc:'Bu Sari',ask:'Pesanan: semangkuk bakso kuah hangat.',correct:'🍜 Bakso',choices:['🍜 Bakso','🍛 Nasi goreng','🥤 Es teh']},
 {npc:'Dika',ask:'Pesanan: minuman dingin dari teh.',correct:'🥤 Es teh',choices:['🥤 Es teh','☕ Kopi panas','🍲 Soto ayam']},
 {npc:'Rani',ask:'Pesanan: nasi yang digoreng dengan bumbu.',correct:'🍛 Nasi goreng',choices:['🍛 Nasi goreng','🍜 Bakso','🥙 Roti isi']},
 {npc:'Pak Budi',ask:'Pesanan: kopi panas untuk petugas pos.',correct:'☕ Kopi panas',choices:['☕ Kopi panas','🥤 Es teh','🍲 Soto ayam']},
 {npc:'Pak Joko',ask:'Pesanan: semangkuk soto ayam.',correct:'🍲 Soto ayam',choices:['🍲 Soto ayam','🍛 Nasi goreng','🥙 Roti isi']}
];
const parkSymbols=['🌻','🌳','🌼','💧'];
let root=null,screen='home',game=null,parkTimer=[],active=true;
const $=s=>root?.querySelector(s);
function day(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'})}
function playerKey(){try{
  const id=(typeof state!=='undefined'&&state?.me?.id)||'pengunjung';
  return KEY+':'+String(id).slice(0,64)
 }catch{return KEY+':pengunjung'}}
function read(){try{
 const obj=JSON.parse(localStorage.getItem(playerKey())||'{}');
 return obj&&typeof obj==='object'?obj:{}
 }catch{return {}}}
function completed(){const obj=read();return obj.day===day()&&Array.isArray(obj.done)?obj.done:[]}
function countTotal(){const obj=read();return Math.max(0,Math.min(9999,Number(obj.total)||0))}
function finish(id,description){
 const obj=read(),done=obj.day===day()&&Array.isArray(obj.done)?obj.done:[];
 const awarded=!done.includes(id);
 if(awarded){done.push(id);obj.total=countTotal()+1}
 obj.day=day();obj.done=done;try{localStorage.setItem(playerKey(),JSON.stringify(obj))}catch{}
 game={kind:'done',id,description,awarded};screen='done';render();
}
function escape(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;','\'':'&#39;'}[m]))}
function clearPark(){parkTimer.forEach(clearTimeout);parkTimer=[]}
function later(fn,t){parkTimer.push(setTimeout(()=>{if(root&&active)fn()},t))}
function open(){
 if(root){root.remove();root=null}clearPark();active=true;screen='home';game=null;
 root=document.createElement('section');root.id='nusaCityLifeRoot';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Kota Hidup: aktivitas warga NPC');
 document.body.append(root);render();root.querySelector('#nclClose')?.focus();
}
function close(){clearPark();active=false;root?.remove();root=null;game=null}
function shell(main){if(!root)return;
 root.innerHTML='<div class="ncl-shell"><header class="ncl-head"><div><small>🏘️ KOTA NUSA · NPC</small><strong>Kota Hidup</strong><span>Aktivitas seru walaupun pemain online sedikit</span></div><button id="nclClose" aria-label="Tutup Kota Hidup">✕</button></header><main class="ncl-content">'+main+'</main><footer class="ncl-foot"><span>🤖 Tokoh NPC, bukan pemain online sungguhan</span><button id="nclHome">Beranda</button></footer></div>';
 $('#nclClose').onclick=close;$('#nclHome').onclick=()=>{clearPark();screen='home';game=null;render()};
}
function render(){
 if(!root)return;
 if(screen==='home'){const done=completed();
 shell('<p class="ncl-intro">Pasar, jalanan, dan taman tetap punya kegiatan. NPC di bawah adalah karakter permainan, <b>tidak dihitung sebagai warga online.</b></p>'+
 '<div class="ncl-meta"><span>✨ Bantuan warga: <b>'+countTotal()+'</b></span><span>Hari ini: <b>'+done.length+'/3</b> aktivitas selesai</span></div>'+
 '<div class="ncl-roster">'+NP.map(p=>'<div class="ncl-person"><span>'+p.emoji+'</span><strong>'+p.name+'</strong><small>NPC · '+p.role+'</small></div>').join('')+'</div>'+
 '<h3 class="ncl-section-title">Pilih aktivitas</h3><div class="ncl-cards">'+[
 ['market','🛒','Pasar Ramai','Layani 5 pembeli NPC yang berganti-ganti.'],
 ['courier','🛵','Kurir Kota','Arahkan kurir melewati jalan menuju 2 alamat.'],
 ['park','🌳','Taman Ceria','Ingat pola empat lampu taman untuk menyiapkan festival.']
 ].map(a=>'<button class="ncl-card" data-game="'+a[0]+'"><span>'+a[1]+'</span><div><strong>'+a[2]+'</strong><small>'+a[3]+'</small></div><em>'+(done.includes(a[0])?'✓ Selesai hari ini':'Main')+'</em></button>').join('')+'</div>'+
 '<p class="ncl-disclaimer">Bantuan warga hanyalah koleksi pencapaian lokal di browser, <b>bukan koin utama, EXP, hadiah berbayar, atau ranking pemain.</b> Semua aktivitas bisa diulang gratis.</p>');
 root.querySelectorAll('[data-game]').forEach(el=>el.onclick=()=>start(el.dataset.game));return;
 }
 if(screen==='done'){
 shell('<div class="ncl-win"><div class="ncl-trophy">🎊</div><h2>Terima kasih, warga!</h2><p>'+escape(game?.description||'Kegiatan berhasil.')+'</p><div class="ncl-bonus">'+(game?.awarded?'+1 Bantuan Warga (koleksi lokal)':'Aktivitas ini sudah dihitung hari ini. Main ulang tetap gratis.')+'</div><button class="ncl-primary" id="nclAgain">Main aktivitas lain</button></div>');
 $('#nclAgain').onclick=()=>{screen='home';game=null;render()};return;
 }
 if(screen==='market')return marketRender();
 if(screen==='courier')return courierRender();
 if(screen==='park')return parkRender();
}
function start(which){clearPark();
 if(which==='market'){screen='market';game={round:0,score:0,error:''}}
 else if(which==='courier'){screen='courier';game={x:0,y:4,stop:0,steps:0,message:'Antarkan paket pertama ke Pasar (🛒).'}}
 else if(which==='park'){screen='park';game={stage:0,pattern:[],answer:0,playing:false,message:'Ingat urutan warna lampu, lalu ulangi.',started:false}}
 else return;render();
}
function marketRender(){
 const order=SHOPS[game.round];if(!order){finish('market','Kelima pesanan di Pasar Nusa sudah terlayani.');return}
 shell('<div class="ncl-level"><b>🛒 Pasar Ramai</b><span>Pelanggan '+(game.round+1)+'/5</span></div>'+
 '<div class="ncl-customer"><span>🧺</span><h3>'+escape(order.npc)+' <small>(NPC)</small></h3><p>'+escape(order.ask)+'</p></div>'+
 '<p class="ncl-hint">Pilih barang yang cocok untuk pelanggan.</p><div class="ncl-choices">'+order.choices.map((v,k)=>'<button data-answer="'+k+'">'+v+'</button>').join('')+'</div>'+
 '<p class="ncl-msg" role="status">'+escape(game.error||'Tepatkan semua pesanan. Tidak ada koin yang dipotong.')+'</p>');
 root.querySelectorAll('[data-answer]').forEach(btn=>btn.onclick=()=>{
  if(order.choices[+btn.dataset.answer]===order.correct){
   game.round++;game.error='✅ Pesanan benar!';render();
  }else{game.error='Coba cek permintaan pelanggan, lalu pilih barang yang sesuai.';render()}
 });
}
const walls=new Set(['1,1','2,1','4,1','4,2','4,3','1,3','2,3']);
const targets=[{x:6,y:4,icon:'🛒',name:'Pasar'},{x:6,y:0,icon:'🏥',name:'Klinik'}];
function courierRender(){
 const target=targets[game.stop];if(!target){finish('courier','Dua paket sampai ke alamat tujuan dengan aman.');return}
 let html='<div class="ncl-level"><b>🛵 Kurir Kota</b><span>Paket '+(game.stop+1)+'/2 · Langkah '+game.steps+'</span></div>'+
 '<p class="ncl-hint">Arahkan kurir dengan tombol panah. Lewati jalan, jangan masuk bangunan. Tujuan: <b>'+target.icon+' '+target.name+'</b>.</p><div class="ncl-grid" role="group" aria-label="Peta kurir tujuh kolom, lima baris">';
 for(let y=0;y<5;y++)for(let x=0;x<7;x++){const key=x+','+y,wall=walls.has(key),current=x===game.x&&y===game.y,loc=targets.find(t=>t.x===x&&t.y===y);
  html+='<div class="ncl-cell '+(wall?'wall':'road')+(current?' current':'')+'" title="'+(wall?'Bangunan':'Jalan')+'">'+(current?'🛵':wall?'🏠':loc?loc.icon:(x+y)%5===0?'🌿':'·')+'</div>';
 }
 html+='</div><div class="ncl-dpad"><span></span><button data-move="0,-1" aria-label="Atas">▲</button><span></span><button data-move="-1,0" aria-label="Kiri">◀</button><button data-move="0,1" aria-label="Bawah">▼</button><button data-move="1,0" aria-label="Kanan">▶</button></div><p class="ncl-msg" role="status">'+escape(game.message)+'</p>';
 shell(html);
 root.querySelectorAll('[data-move]').forEach(el=>el.onclick=()=>{
  const [dx,dy]=el.dataset.move.split(',').map(Number),nx=game.x+dx,ny=game.y+dy;
  if(nx<0||nx>6||ny<0||ny>4||walls.has(nx+','+ny)){game.message='Jalan tertutup. Cari jalur lain!';render();return}
  game.x=nx;game.y=ny;game.steps++;
  if(nx===target.x&&ny===target.y){game.stop++;game.message='✅ Paket '+target.name+' telah sampai! Lanjutkan ke tujuan berikutnya.'}
  else game.message='Kurir berjalan di jalur kota.';
  render();
 });
}
const COL=['#f0c267','#75c6e5','#7cba83','#e98f9b'];
function parkRender(){
 const g=game;
 shell('<div class="ncl-level"><b>🌳 Taman Ceria</b><span>Tahap '+Math.min(3,g.stage+1)+'/3</span></div>'+
 '<p class="ncl-hint">Rani (NPC) meminta bantuan menyalakan lampu taman. Perhatikan pola, lalu tekan lampu dengan urutan yang sama.</p>'+
 '<div class="ncl-lights">'+parkSymbols.map((a,k)=>'<button class="ncl-light" style="--glow:'+COL[k]+'" data-lamp="'+k+'" aria-label="Lampu '+(k+1)+'">'+a+'</button>').join('')+'</div>'+
 '<p class="ncl-msg" id="nclParkMessage" role="status">'+escape(g.message)+'</p>'+
 '<button class="ncl-primary" id="nclParkStart" '+(g.playing?'disabled':'')+'>'+(g.started?'Ulangi pola':'Mulai lihat pola')+'</button>');
 const start=$('#nclParkStart');start.onclick=showPattern;
 root.querySelectorAll('[data-lamp]').forEach(l=>l.onclick=()=>{
  if(g.playing||!g.started)return;
  const guess=Number(l.dataset.lamp);
  if(g.pattern[g.answer]===guess){
    pulse(l);g.answer++;
    if(g.answer>=g.pattern.length){
      g.stage++;g.answer=0;g.started=false;
      if(g.stage>=3){clearPark();finish('park','Ketiga rangkaian lampu taman berhasil diaktifkan.');return}
      g.message='✅ Rangkaian benar! Lanjut ke tahap '+(g.stage+1)+'.';render();
    }else{$('#nclParkMessage').textContent='✅ Benar! Lanjutkan urutannya.'}
  }else{g.message='Belum cocok, perhatikan pola lagi.';g.answer=0;g.started=false;render()}
 });
}
function pulse(el){if(!el)return;el.classList.add('lit');later(()=>el?.classList.remove('lit'),380)}
function showPattern(){
 const g=game;if(screen!=='park'||g.playing)return;clearPark();
 g.pattern=Array.from({length:2+g.stage},()=>Math.floor(Math.random()*4));g.answer=0;g.playing=true;g.started=false;render();
 const msg=$('#nclParkMessage');if(msg)msg.textContent='👀 Perhatikan lampu yang menyala…';
 g.pattern.forEach((lamp,k)=>{
  later(()=>{if(screen!=='park')return;const btn=root?.querySelector('[data-lamp="'+lamp+'"]');pulse(btn)},500+k*800);
 });
 later(()=>{if(screen!=='park')return;g.playing=false;g.started=true;g.message='Sekarang giliranmu! Ulangi pola.';const button=$('#nclParkStart');if(button){button.disabled=false;button.textContent='Ulangi pola'}$('#nclParkMessage').textContent=g.message},700+g.pattern.length*800);
}
window.NusaCityLife={open,close,kind:'Scripted NPC activities'};
document.addEventListener('keydown',e=>{if(!root)return;if(e.key==='Escape'){close();return}if(screen==='courier'){
 const d={ArrowUp:'0,-1',ArrowLeft:'-1,0',ArrowDown:'0,1',ArrowRight:'1,0'}[e.key];
 if(d){e.preventDefault();root.querySelector('[data-move="'+d+'"]')?.click()}
}});
})();

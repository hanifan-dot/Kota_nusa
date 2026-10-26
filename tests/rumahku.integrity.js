const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const rumahku = fs.readFileSync('rumahku.js', 'utf8');

new vm.Script(rumahku, { filename: 'rumahku.js' });

const classicScripts = [...html.matchAll(/<script(?![^>]*type=["']module["'])[^>]*>([\s\S]*?)<\/script>/gi)];
for (const [i, match] of classicScripts.entries()) {
  if (!match[1].trim()) continue;
  new vm.Script(match[1], { filename: `index.inline.${i + 1}.js` });
}

const priceMatch = html.match(/const PRIVATE_HOUSE_STEPS=(\[[^;]+\]);/);
assert.ok(priceMatch, 'Katalog Rumahku harus tersedia');
const levels = JSON.parse(priceMatch[1]);
assert.deepEqual(levels.map(v => v.price), [500, 1500, 5000, 15000, 50000, 150000, 450000, 1200000, 2500000, 5000000]);
assert.deepEqual(levels.map(v => v.level), [1,2,3,4,5,6,7,8,9,10]);

const styleMatch = html.match(/var style=(\[[\s\S]*?\])\[level-1\];/);
assert.ok(styleMatch, 'Katalog bentuk Canvas harus tersedia');
const styles = vm.runInNewContext(`(${styleMatch[1]})`);
assert.equal(styles.length, 10);
assert.equal(new Set(styles.map(v => `${v.w}/${v.d}/${v.h}/${v.roof}`)).size, 10, 'Sepuluh level harus punya geometri/siluet berbeda');

assert.match(html, /demand\(b\.fromLevel===own/);
assert.match(html, /spend\(next\.price\);p\.coins-=next\.price;p\.personalHouseLevel=next\.level/);
assert.match(html, /async function mutate[\s\S]*W=original;throw e/);
assert.match(rumahku, /if\(busy\|\|!mine\(\)\)return/);
assert.match(rumahku, /actual!==next\.level&&returned!==next\.level/);
assert.match(html, /action===['"]grantTestCoins['"]/);
assert.match(html, /target=1000000000/);
assert.match(html, /Saldo percobaan hanya tersedia di situs Netlify tes/);
assert.match(html, /const enabled=false/);

assert.doesNotMatch(html, /\['land',25,22,11,9,5/);
assert.match(html, /CATALOG\.places=CATALOG\.places\.filter\(place=>place\.id!==['"]land['"]\)/);
assert.doesNotMatch(html, /function showHomeManage\(/);
assert.doesNotMatch(html, /function showHouseLevels\(/);
assert.doesNotMatch(html, /Pilih lingkungan rumahmu/);
assert.match(html, /Kavling follower dan Pulau Harapan tidak lagi digambar/);
assert.match(html, /document\.getElementById\('nusaScarvAirship'\)\?\.remove\(\)/);

assert.match(rumahku, /progress<\.28\?\{key:'seed'/);
assert.match(rumahku, /data-stage=/);
assert.match(html, /stage=progress>=1\?"ready":progress<\.28\?"seed":"grow"/);
assert.match(html, /pointerup[\s\S]*walkTo/);
assert.match(html, /seaLife\(ambientTime,!fastGesture\)/);
assert.match(html, /skyLife\(ambientTime,!fastGesture\)/);
assert.match(html, /function seaLife[\s\S]*const boats=[\s\S]*boats\.slice/);
assert.match(html, /function skyLife[\s\S]*if\(m!==['"]night['"]&&m!==['"]rain['"]&&!low\)for/);

console.log(JSON.stringify({
  classicScriptsChecked: classicScripts.length,
  houseLevels: levels.length,
  distinctHouseGeometries: new Set(styles.map(v => `${v.w}/${v.d}/${v.h}/${v.roof}`)).size,
  privateGardenStages: 3,
  legacyParcelVisual: false,
  zeppelinVisual: false
}));

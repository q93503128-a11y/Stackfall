import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const systemsBase=read('src/systems-base.js');
const stats=read('src/run-damage-stats.js');
const index=read('index.html');
const styles=read('styles.css');
const bootstrap=read('src/bootstrap.js');
const languagePack=read('src/language-pack.js');

const checks=[];
const expect=(name,ok)=>checks.push([name,Boolean(ok)]);

expect('actual inflicted damage is recorded once at the common damage sink',systemsBase.includes("registerRunDamage(inflicted,opts.source)"));
expect('damage stats use one-minute timeline buckets',stats.includes('DAMAGE_BUCKET_SECONDS=60')&&stats.includes('stats.timeline[bucket]'));
expect('timeline keeps boundary hits in the closing window and never drops stored buckets',stats.includes("sampleTime=Math.max(0,(Number(state.time)||0)-1e-6)")&&stats.includes('Math.max(1,stats.timeline.length,Math.ceil(totalSeconds/bucketSeconds))'));
expect('overkill-safe total uses inflicted damage from systems-base',systemsBase.includes('Math.min(hpBefore,amount)')&&systemsBase.indexOf('const inflicted=')<systemsBase.indexOf('registerRunDamage(inflicted,opts.source)'));
expect('weapon attribution has an explicit other bucket',stats.includes("DAMAGE_OTHER_KEY='other'")&&stats.includes("return tr('gameover.damage.other')"));
expect('result rendering includes equipment bars and trend line',stats.includes('renderDamageBars(snapshot,target)')&&stats.includes('renderDamageTrend(snapshot,true,target.scope)')&&stats.includes("class:'damage-trend-line'"));
expect('per-weapon timelines are stored in the same one-minute buckets',stats.includes('timelineByWeapon:Object.create(null)')&&stats.includes('stats.timelineByWeapon[key]')&&stats.includes('byWeaponTimeline'));
expect('trend chart can independently hide total and weapon series',stats.includes('damageTrendHidden=new Set()')&&stats.includes("toggleId:stage?'stageDamageTrendToggles':'damageTrendToggles'")&&stats.includes("class:'damage-trend-series'")&&stats.includes('damageTrendHidden.has(key)'));
expect('trend toggle styling exists',styles.includes('.damage-trend-toggles')&&styles.includes('.damage-trend-toggle.off')&&styles.includes('.damage-trend-series'));
expect('new run clears run damage analytics',stats.includes('resetGameWithDamageStats')&&stats.includes('resetRunDamageStats()'));
expect('game over renders run damage analytics',stats.includes('endGameWithDamageStats')&&stats.includes("renderRunDamageResults('gameover')"));
expect('game-over markup exposes summary bars and minute trend chart',index.includes('resultDamageTotal')&&index.includes('resultDamageBars')&&index.includes('damageTrendChart')&&index.includes('<small>1m</small>'));
expect('stage victory also exposes and renders the same damage analytics',index.includes('stageDamageTotal')&&index.includes('stageDamageBars')&&index.includes('stageDamageTrendChart')&&stats.includes('stackfallRenderRunDamageResults=scope=>renderRunDamageResults(scope)')&&read('src/stage-runtime.js').includes("stackfallRenderRunDamageResults?.('stage')"));
expect('analytics wrapper loads after interface and before render event binding',index.indexOf('src/interface.js')<index.indexOf('src/run-damage-stats.js')&&index.indexOf('src/run-damage-stats.js')<index.indexOf('src/render.js'));
expect('result analytics has responsive styling',styles.includes('Run damage results')&&styles.includes('.damage-bar-fill')&&styles.includes('.damage-trend-chart'));
expect('primary language labels exist',bootstrap.includes("'gameover.damage.title':'피해 분석'")&&bootstrap.includes("'gameover.damage.trend':'딜 추이'"));
expect('extended language labels exist',languagePack.includes("'gameover.damage.title':'伤害分析'")&&languagePack.includes("'gameover.damage.title':'ANÁLISIS DE DAÑO'")&&languagePack.includes("'gameover.damage.title':'ANALYSE DES DÉGÂTS'"));

let failed=0;
for(const[name,ok]of checks){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)failed++;}
console.log('Checked '+checks.length+' damage-result contracts; failures='+failed);
if(failed)process.exit(1);

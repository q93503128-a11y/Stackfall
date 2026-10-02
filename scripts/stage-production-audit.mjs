import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require(process.env.STACKFALL_PLAYWRIGHT||'playwright');
const out=resolve('test-results','production-audit');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.STACKFALL_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const results=[];
try{
  for(const config of[{name:'gpu',width:1440,height:900,gpu:true},{name:'canvas',width:1440,height:900,gpu:false},{name:'mobile',width:390,height:844,gpu:false}]){
    const page=await browser.newPage({viewport:config}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    if(!config.gpu)await page.route(/pixi/i,r=>r.abort());
    await page.goto('http://127.0.0.1:8000/?dev=1&build-check=production-audit',{waitUntil:'networkidle'});await page.waitForFunction(()=>stackfallDeveloperTest?.enabled&&typeof stackfallRendererInfo==='function');
    if(config.gpu)await page.waitForFunction(()=>stackfallRendererInfo().status==='active');
    const rows=await page.evaluate(async ()=>{
      GAME_SETTINGS.audio.master=false;window.__stackfallLoopGeneration++;const rows=[];
      for(let n=1;n<=18;n++){
        const id='stage-'+String(n).padStart(2,'0');stackfallDeveloperTest.jumpStageBoss(id);await Promise.resolve();const previewSettled=state.mode==='playing'&&state.startLevelBonusRemaining===0;stackfallDeveloperTest.setInvincible(true);stackfallDeveloperTest.setLevelUpsDisabled(true);state.time=state.stageRun.stage.boss.spawnAt;updateSpawning(1/60);const intro=state.realmTransition?.duration;if(state.realmTransition)updateRealmTransition(intro);
        const boss=state.entities.enemies.find(e=>e.kind==='stage-boss'),production=stackfallStageProduction(id),checks=[previewSettled];if(!boss){rows.push({id,ok:false});continue;}
        boss.hp=boss.maxHp*.25;state.time+=1/60;updateEnemies(1/60);updateHUD();state.mode='paused';const left=document.querySelector('.top-left').getBoundingClientRect(),timer=document.querySelector('.top-center').getBoundingClientRect(),bar=document.querySelector('#multiBossBars').getBoundingClientRect();if(innerWidth<760)checks.push(timer.top>=left.bottom&&bar.top>=timer.bottom);const original=StageCraft.paint,paints=[];
        StageCraft.paint=function(shape,origin,...args){if(origin===boss)paints.push(JSON.stringify(shape));return original.call(this,shape,origin,...args);};
        let base,critical;try{checks.push(stackfallSetPerformanceTierForTest(0)===0);draw();base=paints.splice(0);checks.push(stackfallSetPerformanceTierForTest(2)===2);draw();critical=paints.splice(0);}finally{StageCraft.paint=original;stackfallSetPerformanceTierForTest(null);}
        checks.push(n<3||base.length>0&&JSON.stringify(base)===JSON.stringify(critical));
        if(production){const bodyPixels=tier=>{const savedCtx=ctx,surface=new OffscreenCanvas(900,900);try{ctx=surface.getContext('2d');ctx.translate(450,450);stackfallSetPerformanceTierForTest(tier);production.drawBody(boss);const pixels=ctx.getImageData(0,0,900,900).data;let hash=2166136261,visible=0;for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i]>0)visible++;}return{hash:hash>>>0,visible};}finally{ctx=savedCtx;stackfallSetPerformanceTierForTest(null);}};const low=bodyPixels(0),high=bodyPixels(2);checks.push(low.visible>500&&low.hash===high.hash&&low.visible===high.visible);}

        const hitShapes=stackfallStageBodyShapes(boss)||[{kind:'nebula-chambers',r:boss.contactR,visualR:boss.visualR}];checks.push(n===2?boss.visualR===64&&boss.r===92&&boss.contactR===64:hitShapes.length>0);
        const metadata=production?{music:production.music,explorationMusic:production.explorationMusic,actions:production.actions,mobileScale:production.mobileScale||.72,victory:production.victoryDuration}:{music:n===1?'warden':'heart',explorationMusic:n===1?'frontier':'trench',victory:n===1?3.4:3.6};
        checks.push(audio.soundProfiles.music.includes(metadata.music)&&audio.soundProfiles.music.includes(metadata.explorationMusic));
        const worldEvents=stackfallStageBalanceDiagnostics().worldEventPlan;if(n===9)checks.push(worldEvents.every(e=>e.type!=='void'));if(n===10)checks.push(worldEvents.find(e=>e.type==='void')?.at===.13);
        const anatomy=JSON.stringify(hitShapes.map(s=>({kind:s.kind,part:s.part,points:s.points?.map(p=>[Math.round((p.x-boss.x)*10)/10,Math.round((p.y-boss.y)*10)/10]),hw:s.hw,hh:s.hh,r:s.r})));
        rows.push({id,anatomy,worldEvents,ok:checks.every(Boolean),intro,metadata,phase:boss.stagePhase,authoredPaints:{base:base.length,critical:critical.length},checks});
      }
      return rows;
    });
    const hashes=rows.map(r=>{r.anatomyHash=createHash('sha256').update(r.anatomy||'').digest('hex');delete r.anatomy;return r.anatomyHash;});if(new Set(hashes).size!==18)errors.push('duplicate final boss anatomy');
    await page.evaluate(()=>{stackfallSetPerformanceTierForTest(2);draw();});await page.screenshot({path:resolve(out,config.name+'-critical.png')});await page.evaluate(()=>stackfallSetPerformanceTierForTest(null));results.push({name:config.name,buildSha:await page.evaluate(()=>window.STACKFALL_BUILD_SHA),ok:rows.every(r=>r.ok)&&errors.length===0,errors,rows});await page.close();
  }
}finally{await browser.close();}
const result={ok:results.every(r=>r.ok),results};writeFileSync(resolve(out,'results.json'),JSON.stringify(result,null,2));
for(const r of results)console.log(r.ok?'PASS':'FAIL',r.name,JSON.stringify({errors:r.errors,failed:r.rows.filter(row=>!row.ok)}));if(!result.ok)process.exitCode=1;

import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';

await fs.mkdir('screenshots',{recursive:true});
const server=spawn('python3',['-m','http.server','4173','--directory','dist'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(1400);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--disable-background-timer-throttling']});
const page=await browser.newPage({viewport:{width:2400,height:1500},deviceScaleFactor:1});
page.setDefaultTimeout(300000);
const errors=[],warnings=[],network=[];
page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error('BROWSER',m.text());}else if(m.type()==='warning')warnings.push(m.text());else if(m.text().startsWith('GARDEN'))console.log(m.text());});
page.on('pageerror',e=>{errors.push(e.stack||e.message);console.error('PAGEERROR',e);});
page.on('requestfailed',r=>network.push({url:r.url(),failure:r.failure()}));
const shots=[['overview','01-garden-day'],['bluehour','02-blue-hour'],['night','03-garden-night'],['hall','04-hall'],['study','05-study'],['bedroom','06-bedroom'],['structure','07-timber-cutaway']];
const report={created:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,runner:'GitHub-hosted Ubuntu; Chromium ANGLE SwiftShader. No local/phone rendering.',shots:[],errors,warnings,network};
let failure=null;
try{
 console.log('Opening actual built Three.js application…');
 await page.goto('http://127.0.0.1:4173/?capture=1',{waitUntil:'domcontentloaded',timeout:300000});
 await page.waitForFunction(()=>window.__GARDEN_READY__||window.__GARDEN_ERROR__,null,{timeout:480000});
 const initError=await page.evaluate(()=>window.__GARDEN_ERROR__);if(initError)throw new Error(initError);
 const initial=await page.evaluate(()=>window.garden.diagnostics());report.initial=initial;
 if(initial.photographicPBR.length<3)throw new Error('Not enough photographic PBR material sets for the requested finish.');
 if(initial.leafCount<10000)throw new Error('Planting construction is incomplete.');
 for(const [preset,file]of shots){
  const t=Date.now();console.log('RENDERING',preset);
  const diagnostic=await page.evaluate(async name=>await window.garden.capture(name),preset);
  const frameSample=await page.evaluate(()=>window.garden.frameSample());
  if(frameSample.mean<2||(diagnostic.time<.80&&frameSample.blackPixels>=3))throw new Error(`The ${preset} framebuffer contains unrendered black regions; refusing to publish it.`);
  if(Math.hypot(...diagnostic.camera.map((v,i)=>v-diagnostic.expectedCamera[i]))>.015)throw new Error(`Camera pose for ${preset} was unexpectedly clamped.`);
  diagnostic.frameSample=frameSample;
  await page.screenshot({path:`screenshots/${file}.png`,type:'png',timeout:300000});
  await page.screenshot({path:`screenshots/${file}.jpg`,type:'jpeg',quality:94,timeout:300000});
  report.shots.push({preset,file,seconds:(Date.now()-t)/1000,diagnostic});console.log('CAPTURED',file,report.shots.at(-1).seconds,'seconds');
 }
 console.log('Testing real movement predicates and DOM controls…');
 report.interaction=await page.evaluate(()=>{
  const g=window.garden;
  const route=(ax,az,bx,bz)=>Array.from({length:41},(_,i)=>[ax+(bx-ax)*i/40,az+(bz-az)*i/40]).every(([x,z])=>g.canStand(x,z));
  return {hallToStudy:route(-2.7,-4.8,-6.65,-4.8),hallToBedroom:route(-2.7,-4.8,1.25,-4.8),frontDoor:g.canStand(-2.7,-2.6),dayButton:!!document.querySelector('#day-button'),nightButton:!!document.querySelector('#night-button'),timeRange:document.querySelector('#time').type,walkButton:!!document.querySelector('#walk-button')};
 });
 if(!report.interaction.hallToStudy||!report.interaction.hallToBedroom||!report.interaction.frontDoor)throw new Error('A required interior circulation route is blocked.');
 await page.click('[data-view=hall]');await page.evaluate(()=>window.garden.setView('hall'));await page.click('#walk-button');
 const before=await page.evaluate(()=>window.garden.position());const after=await page.evaluate(()=>window.garden.step('forward',.22));
 report.interaction.firstPersonActuallyMoved=Math.hypot(after[0]-before[0],after[2]-before[2])>.15;
 if(!report.interaction.firstPersonActuallyMoved)throw new Error('First-person movement did not move the camera.');
 await page.keyboard.press('Escape');report.interaction.escapeExitsWalking=await page.evaluate(()=>!window.garden.diagnostics().walking);
 await page.evaluate(()=>window.garden.setTime(.1));await page.click('#night-button');
 const mid=await page.evaluate(()=>window.garden.advance(.35));const later=await page.evaluate(()=>window.garden.advance(.65));
 await page.click('#day-button');const back=await page.evaluate(()=>window.garden.advance(.4));
 report.interaction.continuousDayNight={mid,later,back,ok:mid>.1&&mid<later&&later<1&&back<later};
 if(!report.interaction.continuousDayNight.ok)throw new Error('Visible day/night controls did not drive a continuous light transition.');
 if(errors.some(e=>/Shader Error|VALIDATE_STATUS|GL_INVALID|Error|THREE.WebGLProgram/i.test(e)))throw new Error('Browser/GL errors were recorded; screenshots require review.');
 report.ok=true;
}catch(e){failure=e;report.ok=false;report.failure=e.stack||String(e);console.error(e);await page.screenshot({path:'screenshots/failure.jpg',type:'jpeg',quality:85,timeout:90000}).catch(()=>{});}
finally{
 await fs.writeFile('screenshots/render-report.json',JSON.stringify(report,null,2));
 await browser.close();server.kill();
}
if(failure)process.exit(1);
console.log('All requested views captured.');

'use strict';
(()=>{
const el=id=>document.getElementById(id);
const panel=el('meetingPanel');if(!panel)return;
const open=el('meetingOpen'),close=el('meetingClose'),start=el('meetingStart'),stop=el('meetingStop'),preview=el('meetingPreview'),state=el('meetingState'),timer=el('meetingTimer'),mode=el('meetingMode'),consent=el('meetingConsent');
let stream=null,recorder=null,parts=[],startedAt=0,tick=null,maxTimer=null,busy=false;
let lastRecording=null;
const forward=el('meetingToTranscribe'),autoTranscribe=el('meetingAutoTranscribe');
const fmt=sec=>[Math.floor(sec/3600),Math.floor(sec/60)%60,sec%60].map(x=>String(x).padStart(2,'0')).join(':');
const say=t=>state.textContent=t;
function openPanel(on){panel.hidden=!on;open.setAttribute('aria-expanded',String(on));if(on)panel.scrollIntoView({behavior:'smooth',block:'start'})}
open.addEventListener('click',()=>openPanel(panel.hidden));
close.addEventListener('click',()=>{if(recorder&&recorder.state==='recording'){say('Gravação em curso. Clique em Parar e salvar antes de fechar.');return}openPanel(false)});
function release(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}preview.srcObject=null;preview.hidden=true;clearInterval(tick);clearTimeout(maxTimer)}
function save(){
 const type=recorder?.mimeType||'video/webm';
 if(!parts.length){say('Não foi possível salvar: a gravação ficou vazia.');return}
 const blob=new Blob(parts,{type}),extension=type.includes('mp4')?'mp4':type.includes('ogg')?'ogg':mode.value==='audio'?'webm':'webm';
 const a=document.createElement('a'),url=URL.createObjectURL(blob);
 a.href=url;a.download='RASTRO_Reuniao_'+new Date().toISOString().replace(/[:.]/g,'-')+'.'+extension;
 lastRecording=new File([blob],a.download,{type:blob.type||'video/webm'});
 forward.disabled=lastRecording.size>80*1024*1024;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 say('Gravação concluída: '+(blob.size/1048576).toFixed(1)+' MB. Verifique se o arquivo foi salvo no seu dispositivo.');
 if(lastRecording.size>80*1024*1024)say('Gravação salva, mas supera 80 MB; reduza ou divida para transcrever.');
 else if(autoTranscribe?.checked){say('Gravação salva. Encaminhando à transcrição autorizada...');window.dispatchEvent(new CustomEvent('rastro-meeting-ready',{detail:{file:lastRecording,mode:mode.value}}));}
 parts=[];recorder=null;
}
start.addEventListener('click',async()=>{
 if(busy||recorder?.state==='recording')return;
 if(!consent.checked){say('Antes de iniciar, confirme o consentimento dos participantes.');return}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){say('Seu navegador não oferece suporte à gravação. Use Chrome, Edge ou outro navegador atualizado em HTTPS.');return}
 busy=true;start.disabled=true;lastRecording=null;forward.disabled=true;
 try{
  const audioOnly=mode.value==='audio';
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:audioOnly?false:{width:{ideal:1280},height:{ideal:720},frameRate:{ideal:24}}});
  if(!audioOnly){preview.srcObject=stream;preview.hidden=false;preview.play().catch(()=>{})}
  const mime=[audioOnly?'audio/webm;codecs=opus':'video/webm;codecs=vp8,opus',audioOnly?'audio/webm':'video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
  parts=[];recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:audioOnly?undefined:1200000}:undefined);
  recorder.ondataavailable=e=>{if(e.data?.size)parts.push(e.data)};
  recorder.onerror=()=>say('Falha durante a gravação. Pare e confira o arquivo.');
  recorder.onstop=()=>{release();save();start.disabled=false;stop.disabled=true;mode.disabled=false;busy=false;timer.textContent='00:00:00'};
  recorder.start(10000);startedAt=Date.now();stop.disabled=false;mode.disabled=true;
  tick=setInterval(()=>{timer.textContent=fmt(Math.floor((Date.now()-startedAt)/1000))},1000);
  maxTimer=setTimeout(()=>{if(recorder?.state==='recording'){say('Limite de 180 minutos atingido. Encerrando e salvando.');recorder.stop()}},180*60*1000);
  say('🔴 GRAVANDO — câmera/microfone ativos. Participantes informados. Clique em Parar e salvar ao finalizar.');
 }catch(e){release();busy=false;start.disabled=false;stop.disabled=true;mode.disabled=false;say(e?.name==='NotAllowedError'?'Permissão negada. Autorize a câmera e o microfone nas configurações do site.':e?.name==='NotFoundError'?'Não encontrei câmera ou microfone no dispositivo.':'Não foi possível iniciar: '+(e.message||'erro desconhecido'))}
});
forward.addEventListener('click',()=>{if(!lastRecording){say('Grave uma reunião antes de transcrever.');return}if(lastRecording.size>80*1024*1024){say('Arquivo acima de 80 MB. Divida ou reduza o vídeo.');return}window.dispatchEvent(new CustomEvent('rastro-meeting-ready',{detail:{file:lastRecording,mode:mode.value}}));say('Gravação encaminhada para a transcrição. Consulte o estado na área de material.');});
stop.addEventListener('click',()=>{if(recorder?.state==='recording'){stop.disabled=true;say('Finalizando e preparando o arquivo...');recorder.stop()}});
window.addEventListener('beforeunload',e=>{if(recorder?.state==='recording'){e.preventDefault();e.returnValue=''}});
})();

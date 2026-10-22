'use strict';
const $=id=>document.getElementById(id);
const topics=['Mentira comprovada (exige prova de intenção)','Falsidade factual','Afirmação enganosa','Meia-verdade','Fora de contexto','Omissão relevante','Número impreciso','Generalização indevida','Falácia lógica','Falsa causalidade','Falsa equivalência','Contradição verificável','Sem evidências','Não verificável','Previsão como certeza','Enquadramento tendencioso','Apelo emocional','Seleção de dados','Atribuição indevida','Verdadeiro e contextualizado'];
let mode='url',report='',currentMedia=null,mediaURL=null;
const notify=s=>{$('notice').textContent=s};
const list=$('topics');topics.forEach((name,i)=>{const label=document.createElement('label');label.className='topic';const check=document.createElement('input');check.type='checkbox';check.value=i;check.checked=true;check.addEventListener('change',counter);const num=document.createElement('b');num.textContent=String(i+1).padStart(2,'0');label.append(check,num,document.createTextNode(name));list.append(label)});
const selected=()=>[...document.querySelectorAll('.topic input:checked')].map(e=>Number(e.value));
function counter(){$('count').textContent=selected().length+' selecionadas'}counter();
$('all').onclick=()=>{document.querySelectorAll('.topic input').forEach(x=>x.checked=true);counter()};
$('none').onclick=()=>{document.querySelectorAll('.topic input').forEach(x=>x.checked=false);counter()};
[...document.querySelectorAll('[data-mode]')].forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b===button));['url','video','audio','text'].forEach(k=>$('pane-'+k).hidden=k!==mode);notify('Entrada selecionada: '+mode)}));
$('openUrl').onclick=()=>{try{const u=new URL($('url').value);if(!['http:','https:'].includes(u.protocol))throw Error();window.open(u.href,'_blank','noopener,noreferrer')}catch{notify('Digite uma URL HTTP(S) válida.')}};
$('extractUrl').onclick=async()=>{
 const url=$('url').value.trim(),button=$('extractUrl');
 if(!url){notify('Informe a URL pública da publicação.');return;}
 busy(button,true,'✦ Ler conteúdo da URL');
 try{
  const data=await request('/api/url/extract',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
  $('transcript').value=data.text||'';
  notify((data.note||'Texto extraído.')+' URL original preservada.');
 }catch(e){notify('Falha ao ler URL: '+e.message)}
 finally{busy(button,false,'✦ Ler conteúdo da URL');}
};
for(const kind of ['audio','video'])$(kind).addEventListener('change',e=>{currentMedia=e.target.files[0]||null;const player=$(kind+'Preview');if(mediaURL)URL.revokeObjectURL(mediaURL);if(!currentMedia)return;mediaURL=URL.createObjectURL(currentMedia);player.src=mediaURL;player.hidden=false;notify('Arquivo selecionado: '+currentMedia.name)});
$('subtitle').addEventListener('change',async e=>{const f=e.target.files[0];if(f){$('transcript').value=await f.text();notify('Transcrição importada: '+f.name)}});
async function request(route,opts={}){if(route!=='/api/health'){const isFree=sessionStorage.getItem('rastro_mode')==='free';if(isFree&&route==='/api/transcribe')throw Error('A transcrição é exclusiva do passe pago de 12 horas.');const token=isFree?'':(sessionStorage.getItem('rastro_token')||'');if(!isFree&&!token)throw Error('Escolha o acesso gratuito ou informe o código do passe.');opts.headers={...(opts.headers||{}),...(isFree?{'X-RASTRO-FREE':'1'}:{'X-RASTRO-TOKEN':token})};}const r=await fetch(route,opts);if(r.status===401){sessionStorage.removeItem('rastro_token');sessionStorage.removeItem('rastro_mode');}let j;try{j=await r.json()}catch{throw Error('Resposta inválida do servidor.')}if(!r.ok)throw Error(j.error||'Erro HTTP '+r.status);return j}
(async()=>{try{const h=await request('/api/health');$('health').textContent=h.configured?'● API conectada':'● chave de API não configurada';notify(h.configured?'Servidor pronto para transcrição e pesquisa.':'Servidor ativo; falta configurar OPENAI_API_KEY.')}catch{$('health').textContent='● servidor indisponível';notify('Abra o site no servidor Node.js. A página HTML sozinha não executa APIs.')}})();
function busy(button,active,label){button.disabled=active;button.textContent=active?'⏳ Processando...':label}
$('transcribe').onclick=async()=>{const f=currentMedia||$('audio').files[0]||$('video').files[0];if(!f){notify('Escolha Áudio ou Filme e selecione um arquivo de mídia.');return}const button=$('transcribe');busy(button,true,'✦ Transcrever mídia');notify('Enviando e transcrevendo a mídia selecionada. O serviço pode levar mais tempo em vídeos longos.');try{const fd=new FormData();fd.append('media',f);const data=await request('/api/transcribe',{method:'POST',body:fd});$('transcript').value=data.text;notify('Transcrição concluída: '+data.segments.length+' segmentos. '+data.note)}catch(e){notify('Erro na transcrição: '+e.message)}finally{busy(button,false,'✦ Transcrever mídia')}};

function sourceInfo(){
 const type={url:'URL',video:'FILME / VÍDEO',audio:'ÁUDIO',text:'TEXTO'}[mode]||'MATERIAL';
 const url=$('url')?.value.trim()||'';
 const file=(mode==='video'?$('video')?.files[0]:mode==='audio'?$('audio')?.files[0]:null);
 const sub=$('subtitle')?.files[0];
 const value=mode==='url'?(url||'URL não informada'):file?.name||(mode==='text'?'Texto inserido no RASTRO':sub?.name||'Transcrição fornecida');
 return {type,value,sourceURL:mode==='url'?url:'',date:new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})};
}
function reportHeader(info){
 return ['RASTRO — LAUDO PRELIMINAR','AUDITORIA: '+(info.auditId||'Sem ID'),'MATERIAL ANALISADO: '+info.value,'TIPO: '+info.type,...(info.sourceURL?['URL ORIGINAL: '+info.sourceURL]:[]),'DATA (BRASÍLIA): '+info.date,'────────────────────────────────',''].join('\\n');
}
function renderSource(info){
 const box=$('reportSource');if(!box)return;
 box.replaceChildren();
 const strong=document.createElement('strong');strong.textContent='AUDITORIA '+(info.auditId||'Sem ID')+' — '+info.type;
 const label=document.createElement('div');label.textContent=info.value;
 const date=document.createElement('small');date.textContent='Análise: '+info.date+' (Brasília)';
 box.append(strong,label,date);
 if(info.sourceURL){const a=document.createElement('a');a.href=info.sourceURL;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Abrir URL original ↗';box.append(a)}
}

$('audit').onclick=async()=>{const text=mode==='text'?$('plain').value.trim():$('transcript').value.trim();if(!text){notify('Cole um texto ou gere/importe uma transcrição.');return}if(!selected().length){notify('Selecione ao menos uma categoria.');return}const button=$('audit');busy(button,true,'🔎 Pesquisar evidências');notify('Pesquisando fontes na web e preparando o laudo preliminar...');try{const data=await request('/api/audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,selected:selected(),source:$('url').value.trim(),sourceType:mode,sourceName:sourceInfo().value})});const info=sourceInfo();info.auditId=data.auditId||'Sem ID';renderSource(info);report=reportHeader(info)+(data.report||'Nenhum conteúdo retornado.');$('report').textContent=data.report||'Nenhum conteúdo retornado.';const box=$('citations');box.replaceChildren();if(data.citations?.length){const title=document.createElement('h3');title.textContent='Fontes citadas';box.append(title);for(const c of data.citations){const a=document.createElement('a');a.href=c.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=c.title+' — '+c.url;box.append(a)}}notify('Laudo '+(data.auditId||'sem ID')+' criado'+(data.persisted?' e registrado no banco.':'; registro permanente indisponível.')+' Revise fontes e conclusões.');$('report').scrollIntoView({behavior:'smooth'})}catch(e){notify('Erro na pesquisa: '+e.message)}finally{busy(button,false,'🔎 Pesquisar evidências')}};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(report);notify('Relatório copiado.')}catch{notify('Não foi possível copiar; selecione o texto manualmente.')}};
$('save').onclick=()=>{const blob=new Blob([report],{type:'text/plain;charset=utf-8'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='RASTRO_Laudo_Preliminar.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};

// Atualiza indicadores de uso auditado após a pesquisa.
const auditButton=document.getElementById('audit');if(auditButton)auditButton.addEventListener('click',()=>setTimeout(()=>window.RastroInventoryRefresh?.(),7000));

document.getElementById('freeMode').onclick=()=>{
 sessionStorage.setItem('rastro_mode','free');
 sessionStorage.removeItem('rastro_token');
 document.getElementById('accessChoice').textContent='Modo gratuito selecionado: uma auditoria textual por dia, até 2.500 caracteres.';
};
document.getElementById('enterPass').onclick=()=>{
 const code=prompt('Cole seu código de acesso de 12 horas (não digite a chave da OpenAI):');
 if(!code)return;
 sessionStorage.setItem('rastro_token',code.trim());
 sessionStorage.setItem('rastro_mode','paid');
 document.getElementById('accessChoice').textContent='Código de passe informado. A validade será verificada pelo servidor ao pesquisar.';
};
document.getElementById('issuePass').onclick=async()=>{
 const ref=document.getElementById('paymentRef').value.trim();
 if(ref.length<5)return alert('Informe a referência da transação confirmada.');
 if(!confirm('Você conferiu o pagamento no aplicativo Nubank?'))return;
 const admin=prompt('Informe o código administrativo privado do RASTRO:');
 if(!admin)return;
 try{
  const r=await fetch('/api/admin/issue-pass',{method:'POST',headers:{'Content-Type':'application/json','X-RASTRO-ADMIN':admin},body:JSON.stringify({reference:ref})});
  const d=await r.json();
  if(!r.ok)throw Error(d.error||'Falha na emissão');
  const output='Código do passe: '+d.code+' | válido até '+new Date(d.expiresAt).toLocaleString('pt-BR')+'. Envie ao comprador somente por canal privado.';
  document.getElementById('passResult').textContent=output;
 }catch(e){document.getElementById('passResult').textContent='Erro: '+e.message}
};


const adminIn=document.getElementById('adminSignIn');
const adminOut=document.getElementById('adminSignOut');
const adminMessage=document.getElementById('adminLoginStatus');
function updateAdminUI(active){
 adminOut.hidden=!active;
 adminIn.hidden=active;
 adminMessage.textContent=active?'Administrador autenticado. Acesso sem cotas comerciais, sujeito aos limites técnicos e aos créditos da API.':'Acesso administrativo não iniciado.';
 if(active)document.getElementById('accessChoice').textContent='Modo administrador ativo.';
}
adminIn?.addEventListener('click',async()=>{
 const token=prompt('Código privado do criador (RASTRO_ACCESS_TOKEN). Não é a chave OpenAI:');
 if(!token)return;
 try{
  const r=await fetch('/api/access/status',{headers:{'X-RASTRO-TOKEN':token.trim()}});
  const result=await r.json();
  if(!result.active||result.mode!=='admin')throw Error('Código administrativo não reconhecido.');
  sessionStorage.setItem('rastro_token',token.trim());
  sessionStorage.setItem('rastro_mode','admin');
  updateAdminUI(true);
 }catch(e){adminMessage.textContent='Não foi possível autenticar: '+e.message}
});
adminOut?.addEventListener('click',()=>{
 sessionStorage.removeItem('rastro_token');
 sessionStorage.removeItem('rastro_mode');
 updateAdminUI(false);
 document.getElementById('accessChoice').textContent='Escolha um acesso para pesquisar.';
});
(async()=>{
 if(sessionStorage.getItem('rastro_mode')==='admin'){
  const token=sessionStorage.getItem('rastro_token');
  if(token){try{const r=await fetch('/api/access/status',{headers:{'X-RASTRO-TOKEN':token}});const d=await r.json();if(d.active&&d.mode==='admin'){updateAdminUI(true);return}}catch{}}
  sessionStorage.removeItem('rastro_token');sessionStorage.removeItem('rastro_mode');
 }
 updateAdminUI(false);
})();

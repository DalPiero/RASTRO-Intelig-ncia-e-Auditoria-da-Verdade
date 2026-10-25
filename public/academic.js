'use strict';
(()=>{
const $=id=>document.getElementById(id);
const status=msg=>{$('academicStatus').textContent=msg};
let documentText='',name='',hits=[];
window.rastroAcademicText=()=>documentText;
const words=s=>(s.match(/\S+/gu)||[]).length;
const MAX=150000;
async function extract(file){
 const ext=file.name.toLowerCase().split('.').pop();
 if(['txt','md'].includes(ext))return await file.text();
 if(ext==='docx'){
  if(!window.mammoth)throw Error('Leitor DOCX indisponível. Atualize a página.');
  const x=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return x.value||'';
 }
 if(ext==='pdf'){
  if(!window.pdfjsLib)throw Error('Leitor PDF indisponível. Atualize a página.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const pages=[];
  for(let p=1;p<=pdf.numPages;p++){
   const page=await pdf.getPage(p),t=await page.getTextContent();
   pages.push('[Página '+p+'] '+t.items.map(x=>x.str||'').join(' '));
   if(words(pages.join(' '))>MAX)throw Error('O arquivo ultrapassa 150.000 palavras. Divida o documento em partes menores.');
   if(p%20===0)status('Lendo páginas: '+p+' de '+pdf.numPages);
  }
  return pages.join('\n\n');
 }
 throw Error('Formato não suportado. Use TXT, MD, PDF ou DOCX. Para áudio e vídeo, gere ou importe a transcrição na seção de mídia.');
}
$('academicFile').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 documentText='';name='';hits=[];$('academicHits').replaceChildren();$('academicExcerpt').value='';
 if(file.size>35*1024*1024){status('Arquivo maior que 35 MB. Envie uma versão menor.');return}
 status('Extraindo texto de '+file.name+'...');
 try{
  const text=await extract(file),n=words(text);
  if(n>MAX)throw Error('Material acima do limite de 150.000 palavras.');
  documentText=text;name=file.name;status('Pronto: '+name+' — '+n.toLocaleString('pt-BR')+' palavras. Pesquise uma expressão para localizar trechos.');
 }catch(err){status('Não foi possível ler o arquivo: '+err.message)}
});
$('academicFind').addEventListener('click',()=>{
 const term=$('academicSearch').value.trim();
 if(!documentText){status('Importe primeiro um documento.');return}
 if(term.length<2){status('Digite pelo menos dois caracteres para pesquisar.');return}
 const lower=documentText.toLocaleLowerCase('pt-BR'),q=term.toLocaleLowerCase('pt-BR'),out=$('academicHits');
 hits=[];out.replaceChildren();let from=0,pos;
 while((pos=lower.indexOf(q,from))!==-1&&hits.length<80){hits.push({start:Math.max(0,pos-350),end:Math.min(documentText.length,pos+q.length+450)});from=pos+q.length}
 const h=document.createElement('p');h.textContent=hits.length+' resultado(s)'+(hits.length===80?' (exibidos os primeiros 80)':'')+'. Clique para selecionar o trecho.';out.append(h);
 hits.forEach((hit,i)=>{const b=document.createElement('button');b.type='button';b.className='quiet';b.style.cssText='display:block;margin:7px 0;max-width:100%;white-space:normal;text-align:left';b.textContent=(i+1)+'. …'+documentText.slice(hit.start,hit.end).replace(/\s+/g,' ').slice(0,230)+'…';b.addEventListener('click',()=>{$('academicExcerpt').value=documentText.slice(hit.start,hit.end);status('Trecho selecionado de '+name+'. Confira antes de enviar à auditoria.')});out.append(b)})
});
$('academicAudit').addEventListener('click',()=>{
 const excerpt=$('academicExcerpt').value.trim();if(!excerpt){status('Selecione ou cole um trecho.');return}
 if(excerpt.length>45000){status('Limite do motor atual: 45.000 caracteres por auditoria. Reduza o trecho.');return}
 const plain=$('plain');if(!plain){status('Campo de auditoria textual não encontrado.');return}
 plain.value='ORIGEM: '+(name||'Material acadêmico')+'\nTRECHO PARA EXAME:\n'+excerpt;
 const tab=document.querySelector('[data-mode="text"]');tab?.click();
 plain.scrollIntoView({behavior:'smooth',block:'center'});
 status('Trecho transferido para auditoria. Selecione as categorias e clique em Pesquisar evidências. Essa ação não analisa automaticamente o documento inteiro.');
});

let academicCursor=0,academicChunks=[],academicRunning=false,academicReports=[];
function chunksOf(text,max=18000){
 const output=[];let i=0;while(i<text.length){let end=Math.min(i+max,text.length);if(end<text.length){const split=text.lastIndexOf(' ',end);if(split>i+max/2)end=split;}const t=text.slice(i,end).trim();if(t)output.push(t);i=end;}return output;
}
function showAcademicProgress(){
 const progress=$('academicProgress');if(!progress)return;
 const total=academicChunks.length;
 progress.textContent='Lotes analisados: '+academicCursor+'/'+total+' • Palavras processadas nesta análise: '+academicReports.reduce((n,r)=>n+r.words,0).toLocaleString('pt-BR');
}
function academicKey(){return $('academicCode').value.trim()}
$('academicBalance').addEventListener('click',async()=>{
 const token=academicKey();if(!token){status('Informe seu código acadêmico.');return}
 try{const r=await fetch('/api/academic/balance',{headers:{'X-RASTRO-ACADEMIC':token}});const d=await r.json();if(!r.ok)throw Error(d.error||'Falha');$('academicProgress').textContent=d.unlimited?'Acesso do administrador.':('Saldo: '+Number(d.remainingWords).toLocaleString('pt-BR')+' palavras. Sem vencimento e sem renovação automática.')}catch(e){status(e.message)}
});
$('academicReset').addEventListener('click',()=>{if(academicRunning)return;academicCursor=0;academicChunks=[];academicReports=[];$('academicResults').textContent='';showAcademicProgress()});
$('academicRun').addEventListener('click',async()=>{
 if(academicRunning)return;
 if(!documentText){status('Envie um documento antes de iniciar a análise integral.');return}
 const token=academicKey();if(!token){status('Informe seu código de créditos acadêmicos.');return}
 if(!academicChunks.length)academicChunks=chunksOf(documentText);
 if(academicCursor===academicChunks.length){status('Todos os lotes deste documento já foram analisados.');return}
 academicRunning=true;$('academicRun').disabled=true;
 try{
  const stop=Math.min(academicCursor+5,academicChunks.length);
  while(academicCursor<stop){
   const text=academicChunks[academicCursor];
   status('Analisando lote '+(academicCursor+1)+' de '+academicChunks.length+'...');
   const section=(text.match(/\[Página\s+\d+\]/i)||text.match(/(?:capítulo|seção)\s+[^\n]{1,65}/i)||[])[0]||'Lote '+(academicCursor+1);
   const r=await fetch('/api/academic/analyze',{method:'POST',headers:{'Content-Type':'application/json','X-RASTRO-ACADEMIC':token},body:JSON.stringify({text,source:name,section,requestId:'acad_'+crypto.randomUUID()})});
   const d=await r.json();if(!r.ok)throw Error(d.error||'Falha no lote '+(academicCursor+1));
   const wordsUsed=Number(d.consumedWords||0);
   academicReports.push({section,words:wordsUsed,report:d.report||''});
   const block=document.createElement('section'),title=document.createElement('h3'),body=document.createElement('p');title.textContent='Lote '+(academicCursor+1)+' — '+section;body.textContent=d.report||'(Sem conteúdo retornado)';block.append(title,body);$('academicResults').append(block);
   academicCursor++;showAcademicProgress();
  }
  status(academicCursor===academicChunks.length?'Documento processado em todos os lotes. Confira as conclusões de cada parte.':'Pausa após 5 lotes. Clique novamente para continuar, consumindo créditos adicionais.');
 }catch(e){status('Análise interrompida: '+e.message+'. Os lotes já concluídos permanecem registrados na tela.')}finally{academicRunning=false;$('academicRun').disabled=false;}
});
$('academicIssue').addEventListener('click',async()=>{
 const admin=prompt('Informe o código do administrador RASTRO:');if(!admin)return;
 const reference=$('academicReference').value.trim();if(!reference)return status('Informe a referência do pagamento já verificado.');
 if(!confirm('Você já confirmou o recebimento do pagamento fora do RASTRO?'))return;
 try{const r=await fetch('/api/admin/academic/issue',{method:'POST',headers:{'Content-Type':'application/json','X-RASTRO-ADMIN':admin},body:JSON.stringify({reference})});const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível emitir');$('academicIssueResult').textContent='Código (copie e encaminhe privadamente): '+d.code+' — 450.000 palavras, sem vencimento.';}catch(e){$('academicIssueResult').textContent=e.message}
});

let ledgerCache=null;
async function fetchLedger(){
 const token=academicKey();if(!token)throw Error('Informe o código acadêmico.');
 const r=await fetch('/api/academic/ledger',{headers:{'X-RASTRO-ACADEMIC':token}});const d=await r.json();
 if(!r.ok)throw Error(d.error||'Falha ao consultar extrato.');
 ledgerCache=d;return d;
}
$('academicLedger').addEventListener('click',async()=>{
 try{const d=await fetchLedger();const host=$('academicLedgerView');host.replaceChildren();
 const summary=document.createElement('p');summary.textContent='Adquiridas: '+Number(d.purchasedWords).toLocaleString('pt-BR')+' | Consumidas: '+(Number(d.purchasedWords)-Number(d.remainingWords)).toLocaleString('pt-BR')+' | Saldo: '+Number(d.remainingWords).toLocaleString('pt-BR');host.append(summary);
 const table=document.createElement('table');table.style.width='100%';const head=document.createElement('tr');for(const name of ['Data','Movimento','Palavras','Estado','Documento / seção']){const th=document.createElement('th');th.textContent=name;head.append(th)}table.append(head);
 for(const item of d.events){const row=document.createElement('tr');for(const cell of [new Date(item.created_at).toLocaleString('pt-BR'),item.event,item.words,item.status,(item.source_name||'')+' '+(item.section_name||'')]){const td=document.createElement('td');td.textContent=String(cell);td.style.padding='5px';row.append(td)}table.append(row)}host.append(table);
 status('Extrato carregado: últimas '+d.events.length+' movimentações.');
 }catch(e){status('Extrato indisponível: '+e.message)}
});
$('academicLedgerCsv').addEventListener('click',async()=>{
 try{const d=await fetchLedger();const fields=['created_at','request_id','event','words','status','balance_after','source_name','section_name'];const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';const lines=[fields.join(';'),...d.events.map(e=>fields.map(k=>quote(e[k])).join(';'))];const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='RASTRO_Extrato_Creditos.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Extrato CSV gerado.')}catch(e){status(e.message)}
});
})();
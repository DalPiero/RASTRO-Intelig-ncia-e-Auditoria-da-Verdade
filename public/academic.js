'use strict';
(()=>{
const $=id=>document.getElementById(id);
const status=msg=>{$('academicStatus').textContent=msg};
let documentText='',name='',hits=[];
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
})();
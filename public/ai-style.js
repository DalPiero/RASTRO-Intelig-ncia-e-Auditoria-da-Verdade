'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const textInput=$('aiStyleText'),output=$('aiStyleResults'),status=$('aiStyleStatus');
 if(!textInput||!output)return;
 let summary='';
 const wordCount=s=>(s.match(/\S+/gu)||[]).length;
 const connectives=/\b(além disso|nesse contexto|dessa forma|por outro lado|em suma|em conclusão|vale ressaltar|é importante destacar|cabe destacar|por fim|em primeiro lugar|em segundo lugar|em última análise|fundamental destacar|crucial compreender)\b/gi;
 const templates=/\b(é importante (?:notar|destacar|ressaltar)|vale (?:a pena )?ressaltar|no mundo (?:atual|moderno)|desempenha um papel (?:crucial|fundamental)|não apenas.{0,90}mas também|em um (?:cenário|contexto) cada vez mais|uma abordagem (?:holística|abrangente)|a chave para o sucesso)\b/gi;
 const getMatches=(re,s)=>[...s.matchAll(re)].length;
 function analyze(text){
  const passages=text.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/u).map(s=>s.trim()).filter(Boolean);
  const starts=new Map();
  for(const passage of passages){const first=(passage.match(/^([\p{L}]+(?:\s+[\p{L}]+){0,2})/u)||[])[1]?.toLocaleLowerCase('pt-BR');if(first)starts.set(first,(starts.get(first)||0)+1)}
  const flagged=[];
  let countedWords=0;
  for(const [i,p] of passages.entries()){
   const reasons=[],connect=getMatches(connectives,p),template=getMatches(templates,p);
   const first=(p.match(/^([\p{L}]+(?:\s+[\p{L}]+){0,2})/u)||[])[1]?.toLocaleLowerCase('pt-BR');
   if(connect>=2)reasons.push('Conectivos discursivos recorrentes');
   if(template>=2)reasons.push('Expressões formulaicas repetidas');
   if(connect&&template)reasons.push('Conectivos e construções padronizadas no mesmo trecho');
   if(first&&starts.get(first)>=3&&passages.length>=6)reasons.push('Abertura semelhante repetida em três ou mais trechos');
   const hasSignal=reasons.length>0&&wordCount(p)>=8;
   if(hasSignal){const count=wordCount(p);countedWords+=count;flagged.push({number:i+1,text:p,words:count,reasons})}
  }
  return {total:wordCount(text),covered:countedWords,flagged,passages:passages.length};
 }
 $('aiStyleRun').addEventListener('click',()=>{
  const text=textInput.value.trim();output.replaceChildren();summary='';window.rastroStyleResult=null;
  if(text.length<100){status.textContent='Envie pelo menos 100 caracteres para examinar padrões de estilo.';return}
  const data=analyze(text),percent=data.total?100*data.covered/data.total:0;
  window.rastroStyleResult={...data,characters:text.length,date:new Date().toISOString(),text};window.dispatchEvent(new Event('rastro-style-analyzed'));
  const title=document.createElement('h3');title.textContent='Trechos sinalizados: '+percent.toFixed(1).replace('.',',')+'% das palavras examinadas';output.append(title);
  const info=document.createElement('p');info.textContent='Palavras sinalizadas: '+data.covered.toLocaleString('pt-BR')+' de '+data.total.toLocaleString('pt-BR')+' • Trechos com sinais: '+data.flagged.length+' de '+data.passages+'. Este é um índice de cobertura de padrões, NÃO a probabilidade de uso de IA.';output.append(info);
  summary=title.textContent+'\n'+info.textContent+'\n';
  if(!data.flagged.length){const p=document.createElement('p');p.textContent='Nenhuma passagem atingiu os critérios selecionados. Isso não comprova autoria humana.';output.append(p);summary+='\n'+p.textContent}
  for(const item of data.flagged.slice(0,12)){
   const h=document.createElement('h4');h.textContent='Trecho '+item.number+' — '+item.reasons.join('; ');const q=document.createElement('blockquote');q.textContent=item.text.slice(0,950)+(item.text.length>950?' […]':'');output.append(h,q);summary+='\n'+h.textContent+'\n“'+q.textContent+'”\n';
  }
  if(data.flagged.length>12){const p=document.createElement('p');p.textContent='Exibidos os 12 primeiros trechos de '+data.flagged.length+' sinalizados.';output.append(p);summary+='\n'+p.textContent}
  const caveat=document.createElement('p');caveat.textContent='Conclusão: sinais textuais não identificam autor, ferramenta ou intenção. Para avaliação editorial, contraste com versões anteriores, fontes e contexto.';output.append(caveat);summary+='\n'+caveat.textContent;
  status.textContent='Análise exploratória concluída localmente. Nenhuma informação foi enviada para detecção por servidor.';
 });

 $('aiStyleAudit20')?.addEventListener('click',()=>{
  const t=textInput.value.trim();
  if(!t)return void(status.textContent='Cole um texto antes da auditoria.');
  if(t.length>45000)return void(status.textContent='Limite de 45.000 caracteres por chamada. Selecione um trecho.');
  const p=$('plain');if(!p)return void(status.textContent='Área de auditoria indisponível.');
  p.value=t;
  document.querySelector('[data-mode="text"]')?.click();
  $('all')?.click();
  $('audit')?.scrollIntoView({behavior:'smooth'});
  status.textContent='Texto transferido; clique em Pesquisar evidências para executar a pesquisa com os 20 parâmetros.';
 });

 const unified=$('aiUnifiedStatus');
 const direct=$('aiStyleAudit20Direct'),combined=$('aiStyleCombined');
 let running=false;
 async function runDocumentary(combine){
  if(running)return;
  const t=textInput.value.trim();
  if(!t){unified.textContent='Cole ou importe um documento antes de iniciar.';return}
  if(t.length>45000){unified.textContent='A auditoria documental está limitada a 45.000 caracteres por execução. Selecione um trecho; os demais não serão declarados verificados.';return}
  if(typeof window.rastroRun20Academic!=='function'){unified.textContent='Auditor documental indisponível. Recarregue a página.';return}
  running=true;direct.disabled=true;combined.disabled=true;
  try{
   if(combine){$('aiStyleRun').click();unified.textContent='Análise de estilo concluída. Executando pesquisa documental dos 20 parâmetros...'}
   else unified.textContent='Pesquisando fontes com os 20 parâmetros selecionados...';
   const result=await window.rastroRun20Academic(t);
   if(!result)throw Error('A pesquisa não retornou um laudo.');
   unified.textContent='Pesquisa documental concluída (ID '+(result.auditId||'sem ID')+'). '+(combine?'As duas análises estão vinculadas ao mesmo texto; baixe DOCX/PDF/PNG na seção de relatório.':'Consulte o laudo e as fontes no auditor factual.');
   if(combine)$('aiCharts')?.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(e){unified.textContent='Não foi possível concluir a auditoria: '+e.message+'. Nenhum parâmetro será apresentado como verificado sem pesquisa concluída.'}
  finally{running=false;direct.disabled=false;combined.disabled=false}
 }
 direct?.addEventListener('click',()=>runDocumentary(false));
 combined?.addEventListener('click',()=>runDocumentary(true));
 $('aiStyleCopy').addEventListener('click',async()=>{if(!summary){status.textContent='Analise um texto antes de copiar.';return}try{await navigator.clipboard.writeText(summary);status.textContent='Resultado copiado.'}catch{status.textContent='Não foi possível copiar automaticamente. Selecione o resultado na tela.'}});
 window.rastroStyleLoadDocument=text=>{textInput.value=String(text||'').slice(0,300000);status.textContent='Documento acadêmico transferido para o exame de estilo ('+wordCount(textInput.value).toLocaleString('pt-BR')+' palavras, limitado a 300.000 caracteres).';textInput.scrollIntoView({behavior:'smooth',block:'center'})};
 $('aiStyleImportAcademic').addEventListener('click',()=>{if(typeof window.rastroAcademicText!=='function'){status.textContent='Leitor acadêmico indisponível. Atualize a página.';return}const text=window.rastroAcademicText();if(!text){status.textContent='Carregue primeiro um documento no RASTRO Acadêmico.';return}window.rastroStyleLoadDocument(text)});
})();

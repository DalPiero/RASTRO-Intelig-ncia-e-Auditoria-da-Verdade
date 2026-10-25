'use strict';
(()=>{
 const $=id=>document.getElementById(id),host=$('aiCharts'),choice=$('aiChartType'),message=$('aiExportStatus');
 if(!host||!choice)return;
 let extras=[],current=[];
 const f=n=>Number(n).toLocaleString('pt-BR');
 const ratio=(a,b)=>b?((100*a/b).toFixed(2)).replace('.',',')+'%':'0,00%';
 const labels={bar:'Palavras sinalizadas × demais',donut:'Proporção de palavras sinalizadas',columns:'Trechos sinalizados × demais',reasons:'Frequência de critérios de sinalização'};
 const read=()=>window.rastroStyleResult;
 const counts=data=>{const m=new Map();for(const item of data.flagged)for(const reason of item.reasons)m.set(reason,(m.get(reason)||0)+1);return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6)};
 function renderChart(type,data){
  const c=document.createElement('canvas');c.width=960;c.height=440;c.style.cssText='width:100%;max-width:760px;background:#ffffff;border-radius:10px;margin:12px 0';
  const ctx=c.getContext('2d'),W=c.width,H=c.height;
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#18304b';ctx.font='bold 27px Arial';ctx.fillText(labels[type]||labels.bar,38,45);
  const flagged=data.covered,non=Math.max(0,data.total-flagged),flagN=data.flagged.length,otherN=Math.max(0,data.passages-flagN);
  const blue='#3075b4',gold='#e5ac48',pale='#d7e5f2';
  const legend=(names,values)=>{ctx.font='19px Arial';names.forEach((name,i)=>{const y=H-85+i*30;ctx.fillStyle=i===0?gold:blue;ctx.fillRect(50,y-15,17,17);ctx.fillStyle='#1d2938';ctx.fillText(name+': '+f(values[i]),77,y)})};
  if(type==='donut'){
   const fraction=data.total?flagged/data.total:0;
   ctx.lineWidth=58;ctx.strokeStyle=blue;ctx.beginPath();ctx.arc(320,221,110,0,Math.PI*2);ctx.stroke();
   if(fraction){ctx.strokeStyle=gold;ctx.beginPath();ctx.arc(320,221,110,-Math.PI/2,-Math.PI/2+fraction*Math.PI*2);ctx.stroke()}
   ctx.font='bold 36px Arial';ctx.fillStyle='#18304b';ctx.textAlign='center';ctx.fillText(ratio(flagged,data.total),320,231);ctx.textAlign='left';
   ctx.font='21px Arial';ctx.fillText('Sinalizadas: '+f(flagged)+' palavras',510,200);ctx.fillText('Demais: '+f(non)+' palavras',510,250);
  }else{
   const entries=type==='columns'?[['Com sinais',flagN],['Sem sinais',otherN]]:type==='reasons'?counts(data):[['Com sinais',flagged],['Sem sinais',non]];
   const list=entries.length?entries:[['Nenhum padrão sinalizado',0]];
   const max=Math.max(1,...list.map(x=>x[1]));
   const top=90,space=Math.min(57,270/list.length);
   list.forEach(([label,value],i)=>{const y=top+i*(space+15);ctx.fillStyle='#273c56';ctx.font='17px Arial';ctx.fillText(label.length>42?label.slice(0,41)+'…':label,43,y+17);ctx.fillStyle=i===0?gold:blue;ctx.fillRect(43,y+26,Math.max(0,Math.round(770*value/max)),space/2);ctx.fillStyle='#18304b';ctx.font='bold 17px Arial';ctx.fillText(f(value),835,y+45)});
  }
  ctx.fillStyle='#45566a';ctx.font='17px Arial';ctx.fillText('RASTRO • frequência descritiva de padrões; não estima autoria de IA',38,H-18);
  return c;
 }
 function update(){
  const data=read();host.replaceChildren();current=[];
  if(!data){message.textContent='Execute primeiro “Examinar padrões e trechos”.';return}
  for(const type of [choice.value,...extras]){
   const wrapper=document.createElement('section');wrapper.style.margin='14px 0';const canvas=renderChart(type,data);
   const heading=document.createElement('h4');heading.textContent=labels[type];wrapper.append(heading,canvas);host.append(wrapper);current.push(canvas);
  }
  message.textContent='Gráficos prontos: '+current.length+'. A exportação inclui estatísticas, metodologia, gráficos e trechos destacados.';
 }
 choice.addEventListener('change',update);
 window.addEventListener('rastro-style-analyzed',()=>{extras=[];update()});
 $('aiChartAdd').addEventListener('click',()=>{if(!read())return update();if(extras.length>=3){message.textContent='Limite de quatro gráficos por relatório (um principal e até três adicionais).';return}const types=['bar','donut','columns','reasons'];const next=types.find(x=>x!==choice.value&&!extras.includes(x));if(!next){message.textContent='Todos os tipos disponíveis já foram adicionados.';return}extras.push(next);update()});
 async function exportDocx(){
  const data=read(),D=window.docx;
  if(!data)throw Error('Examine primeiro o documento para obter estatísticas.');
  if(!D?.Document||!D?.Packer||!D?.ImageRun)throw Error('Biblioteca DOCX indisponível; atualize a página.');
  const {Document,Paragraph,TextRun,ImageRun,HeadingLevel,Packer}=D;
  const p=(s,bold=false)=>new Paragraph({children:[new TextRun({text:String(s),size:22,bold})],spacing:{after:135}});
  const h=s=>new Paragraph({text:s,heading:HeadingLevel.HEADING_2,spacing:{before:220,after:150}});
  const percent=ratio(data.covered,data.total);
  const lead=[
   new Paragraph({text:'RASTRO ACADÊMICO — RELATÓRIO DE PADRÕES DE ESCRITA',heading:HeadingLevel.TITLE}),
   p('Data: '+new Date(data.date).toLocaleString('pt-BR')),p('Método: inspeção heurística de conectivos, estruturas formulaicas e aberturas recorrentes.'),
   h('ESTATÍSTICAS ACADÊMICAS — RESUMO EXECUTIVO'),
   p('Total de palavras: '+f(data.total),true),
   p('Total de caracteres: '+f(data.characters)),
   p('Trechos analisados: '+f(data.passages)),
   p('Trechos sinalizados: '+f(data.flagged.length)),
   p('Proporção de trechos sinalizados: '+ratio(data.flagged.length,data.passages)),
   p('Palavras em trechos sinalizados: '+f(data.covered)),
   p('Palavras em demais trechos: '+f(data.total-data.covered)),
   p('Índice de cobertura de padrões: '+percent,true),
   p('Densidade de trechos sinalizados por 1.000 palavras: '+(data.total?((1000*data.flagged.length/data.total).toFixed(2)).replace('.',','):'0')),
   p('Unidade de análise: passagens segmentadas por parágrafos e sinais de pontuação.'),
   p('Amostra: texto integral fornecido ao campo de análise, sujeito ao limite de 300.000 caracteres.'),
   p('Interpretação: os valores são descritivos. NÃO representam chance de autoria artificial, acurácia, taxa de erro, sensibilidade ou especificidade.'),
   h('VISUALIZAÇÕES ESTATÍSTICAS')
  ];
  const canvases=current.length?current:[renderChart(choice.value,data)];
  for(let i=0;i<canvases.length;i++){
   const type=[choice.value,...extras][i]||choice.value;
   lead.push(p('Figura '+(i+1)+' — '+labels[type],true));
   const png=canvases[i].toDataURL('image/png').split(',')[1],bytes=Uint8Array.from(atob(png),c=>c.charCodeAt(0));
   lead.push(new Paragraph({children:[new ImageRun({data:bytes,transformation:{width:520,height:238},type:'png'})],spacing:{after:190}}));
  }
  lead.push(h('TRECHOS SINALIZADOS E JUSTIFICATIVAS'));
  for(const item of data.flagged.slice(0,80)){lead.push(p('Trecho '+item.number+' — '+item.words+' palavras; critérios: '+item.reasons.join('; '),true),p('“'+item.text.slice(0,2200)+(item.text.length>2200?' […]':'')+'”'))}
  if(data.flagged.length>80)lead.push(p('Foram apresentados os primeiros 80 dos '+data.flagged.length+' trechos sinalizados.'));
  lead.push(h('LIMITAÇÕES E REPRODUTIBILIDADE'),
   p('Regras aplicadas: pelo menos dois conectivos recorrentes, duas expressões formulaicas, combinação de ambas, ou repetição de abertura em três ou mais trechos. Aplicam-se somente a passagens com oito palavras ou mais.'),
   p('A segmentação pode variar em citações, abreviações, outros idiomas e pontuação irregular. Alguns sinais podem ocorrer naturalmente em escrita humana, e textos gerados por IA podem não apresentar qualquer sinal.'),
   p('Não foi validado um classificador estatístico por corpus rotulado, nem foram calculados intervalos de confiança, precisão, revocação ou valor preditivo. Não use o relatório isoladamente para concluir autoria, fraude ou plágio.'),
   p('Sugestões de triangulação: comparar versões datadas, histórico editorial, fontes citadas e metadados obtidos licitamente, com revisão humana.'));
  const doc=new Document({sections:[{properties:{page:{margin:{top:850,bottom:850,left:850,right:850}}},children:lead}]});
  const blob=await Packer.toBlob(doc),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='RASTRO_Academico_Analise_Estilo_'+new Date().toISOString().slice(0,10)+'.docx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 const button=$('aiDocxExport');button?.addEventListener('click',async()=>{button.disabled=true;try{await exportDocx();message.textContent='Arquivo DOCX preparado. Confira o arquivo salvo e revise estatísticas e interpretação.'}catch(e){message.textContent='Falha na exportação: '+e.message}finally{button.disabled=false}});
})();

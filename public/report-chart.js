'use strict';
(() => {
const host=document.querySelector('section.report');if(!host)return;
const s=document.createElement('section');s.className='card';s.style.marginBottom='30px';
s.innerHTML='<div class="step">04B / RELATÓRIO VISUAL</div><h2>Exportar resultados em imagem</h2><p class="desc">Os números são extraídos exclusivamente das alegações do relatório atual. Sem laudo válido, o gráfico fica bloqueado. Confira os vereditos antes de divulgar.</p><div id="rastro-chart-inputs"></div><div class="buttons"><label>Tipo <select id="rastro-chart-type"><option value="bar">Barras</option><option value="circle">Circular</option></select></label><button class="primary" id="rastro-chart-render">Gerar prévia</button><button class="quiet" id="rastro-chart-save" disabled>↓ Baixar PNG</button></div><p id="rastro-chart-message" role="status">Preencha os valores verificados.</p><canvas id="rastro-chart-canvas" width="1600" height="900" style="width:100%;height:auto;border-radius:14px"></canvas>';
host.insertAdjacentElement('afterend',s);
const st=document.createElement('style');st.textContent='#rastro-chart-inputs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}#rastro-chart-inputs input,#rastro-chart-type{display:block;width:100%;background:#081626;border:1px solid #56738d;border-radius:9px;color:white;padding:11px;margin-top:7px}@media(max-width:650px){#rastro-chart-inputs{grid-template-columns:1fr}}';document.head.append(st);
const labels=['Verdadeiro / contextualizado','Falso / refutado','Enganoso / fora de contexto','Inconclusivo / sem prova'];
const colors=['#70dccb','#fb7585','#ffd078','#9cafff'];
const inputs=document.getElementById('rastro-chart-inputs');
for(let i=0;i<labels.length;i++){const label=document.createElement('label');label.textContent=labels[i];const el=document.createElement('input');el.type='number';el.min='0';el.max='1000000';el.step='1';el.value='0';el.readOnly=true;el.setAttribute('aria-label',labels[i]);label.append(el);inputs.append(label);}
const cv=document.getElementById('rastro-chart-canvas'),ctx=cv.getContext('2d');
const btn=document.getElementById('rastro-chart-save'),msg=document.getElementById('rastro-chart-message');
const valueEls=[...inputs.querySelectorAll('input')];let ready=false;let validatedReport=false;document.getElementById('rastro-chart-render').disabled=true;
function invalidate(){ready=false;btn.disabled=true;msg.textContent='Valores alterados. Gere uma nova prévia.';}
valueEls.forEach(el=>el.addEventListener('input',invalidate));
document.getElementById('rastro-chart-type').addEventListener('change',invalidate);
function drawText(v,x,y,size=28,color='#f3f7ff',weight=500){ctx.fillStyle=color;ctx.font=weight+' '+size+'px Arial,sans-serif';ctx.fillText(v,x,y);}
// Classificação a partir das seções do próprio laudo. Uma seção = uma alegação.
function classify(verdict){
 const v=String(verdict||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/enganos|meia.verdade|fora de contexto|omiss|distorc|imprecis|falacia|tendencios/.test(v))return 2;
 if(/fals|refutad|incorret|mentira comprovada/.test(v))return 1;
 if(/verdadeir|confirmad|corret|comprovad/.test(v))return 0;
 return 3;
}

const evidence=document.createElement('section');
evidence.className='card';
evidence.innerHTML='<div class="step">04C / RASTREABILIDADE</div><h2>Alegações, classificação e fontes</h2><p class="desc">URLs extraídas do texto do relatório, sem comprovação automática de que cada página foi efetivamente consultada. Verifique cada vínculo antes de publicar.</p><div id="rastro-evidence-table" style="overflow-x:auto"></div><button class="quiet" id="rastro-evidence-csv" type="button">↓ Exportar evidências CSV</button>';
s.insertAdjacentElement('afterend',evidence);
let evidenceRows=[];
function extractEvidence(text){
 const sections=text.split(/(?:\*\*)?Alega(?:ç|c)(?:ã|a)o\s+(\d+)\s*:/i);
 const rows=[];
 for(let i=1;i<sections.length;i+=2){
  const part=sections[i+1]||'';
  const verdict=part.match(/Veredito\s+provis[oó]rio\s*:\s*(?:\*\*)?\s*([^\n\r]+)/i);
  const fragment=part.match(/(?:\*\*)?\s*Trecho\s*:\s*(?:\*\*)?\s*([^\n\r]+)/i);
  const evidenceSection=part.split(/Evid[eê]ncias\s+com\s+links\s*:/i)[1]?.split(/(?:\*\*)?\s*(?:Justificativa|Lacunas)\s*:/i)[0]||'';
  const urls=[...new Set((evidenceSection.match(/https?:\/\/[^\s)\]<>]+/g)||[]).map(u=>u.replace(/[.,;]+$/,'')))];
  rows.push({number:Number(sections[i]),text:(fragment?.[1]||'').replace(/\*\*/g,'').trim(),verdict:(verdict?.[1]||'Não identificado').replace(/\*\*/g,'').trim(),urls});
 }
 return rows;
}
function showEvidence(text){
 evidenceRows=extractEvidence(text);
 const table=document.getElementById('rastro-evidence-table');
 table.replaceChildren();
 if(!evidenceRows.length){table.textContent='Nenhuma alegação numerada identificada.';return;}
 const t=document.createElement('table');t.style.cssText='width:100%;border-collapse:collapse;text-align:left';
 const head=document.createElement('tr');
 for(const name of ['Nº','Trecho','Veredito','Fontes do relatório']){const th=document.createElement('th');th.textContent=name;th.style.padding='12px';head.append(th);}t.append(head);
 for(const r of evidenceRows){
  const tr=document.createElement('tr');tr.style.borderTop='1px solid #49647e';
  for(const value of [r.number,r.text||'—',r.verdict]){const td=document.createElement('td');td.textContent=String(value);td.style.cssText='padding:12px;vertical-align:top';tr.append(td);}
  const cell=document.createElement('td');cell.style.padding='12px';
  if(!r.urls.length)cell.textContent='Nenhuma URL identificada';
  for(const u of r.urls){try{const parsed=new URL(u);if(!['https:','http:'].includes(parsed.protocol))continue;const link=document.createElement('a');link.href=parsed.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=parsed.hostname;link.style.cssText='display:block;margin-bottom:8px';cell.append(link);}catch{}}
  tr.append(cell);t.append(tr);
 }
 table.append(t);
}
document.getElementById('rastro-evidence-csv').addEventListener('click',()=>{
 if(!evidenceRows.length)return;
 const quote=s=>'"'+String(s).replace(/"/g,'""')+'"';
 const rows=[['Número','Trecho','Veredito','URLs'],...evidenceRows.map(r=>[r.number,r.text,r.verdict,r.urls.join(' | ')])];
 const csv='\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='RASTRO_Alegacoes_Fontes.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

let lastParsed='';
function resetChart(message){validatedReport=false;ready=false;btn.disabled=true;document.getElementById('rastro-chart-render').disabled=true;valueEls.forEach(el=>el.value='0');ctx.clearRect(0,0,cv.width,cv.height);evidenceRows=[];document.getElementById('rastro-evidence-table').replaceChildren();msg.textContent=message;}
function loadFromReport(){
 const text=document.getElementById('report')?.textContent||'';
 if(!text.trim()||text.includes('O relatório aparecerá aqui')){resetChart('Aguardando relatório válido para calcular as contagens.');lastParsed='';return;}
 if(text===lastParsed)return;
 const sections=text.split(/(?:\*\*)?Alega(?:ç|c)(?:ã|a)o\s+\d+\s*:/i).slice(1);
 if(!sections.length){resetChart('Nenhuma alegação numerada encontrada; exportação bloqueada.');lastParsed=text;return;}
 const totals=[0,0,0,0];
 for(const section of sections){
  const match=section.match(/(?:\*\*)?\s*[-•]?\s*(?:\*\*)?\s*Veredito\s+provis[oó]rio\s*:\s*(?:\*\*)?\s*([^\n\r]+)/i);
  totals[classify(match?.[1])]++;
 }
 valueEls.forEach((el,i)=>el.value=String(totals[i]));
 validatedReport=true;document.getElementById('rastro-chart-render').disabled=false;
 lastParsed=text;render();showEvidence(text);
 msg.textContent='Leitura automática: '+sections.length+' alegações. Confira a classificação no laudo antes de divulgar.';
}
const reportNode=document.getElementById('report');
if(reportNode)new MutationObserver(loadFromReport).observe(reportNode,{childList:true,characterData:true,subtree:true});
loadFromReport();
function render(){
 if(!validatedReport){resetChart('É necessário concluir uma auditoria válida antes de exportar.');return;}
 const raw=valueEls.map(el=>el.value);const n=raw.map(Number);
 if(raw.some(x=>!x.trim())||n.some(x=>!Number.isSafeInteger(x)||x<0||x>1000000)){invalidate();msg.textContent='Digite inteiros de 0 a 1.000.000.';return;}
 const total=n.reduce((a,b)=>a+b,0);
 if(!total){invalidate();msg.textContent='Informe ao menos um resultado verificado.';return;}
 const grad=ctx.createLinearGradient(0,0,1600,900);grad.addColorStop(0,'#1c3c5a');grad.addColorStop(1,'#071321');ctx.fillStyle=grad;ctx.fillRect(0,0,1600,900);
 drawText('RASTRO',80,110,70,'#ffd078',800);
 drawText('SÍNTESE VISUAL DE ALEGAÇÕES',80,178,42,'#ffffff',700);
 drawText('Contagens extraídas automaticamente do relatório atual',80,230,28,'#bacddd');
 drawText('Total classificado: '+total,80,303,36,'#ffffff',700);
 if(document.getElementById('rastro-chart-type').value==='bar'){
   const max=Math.max(...n);
   n.forEach((v,i)=>{const y=370+i*97;drawText(labels[i],85,y,27);ctx.fillStyle='#2c4258';ctx.fillRect(565,y-30,760,46);ctx.fillStyle=colors[i];ctx.fillRect(565,y-30,760*v/max,46);drawText(v+'  •  '+(100*v/total).toFixed(1).replace('.',',')+'%',1350,y+5,29,'#ffffff',700);});
 }else{
   let start=-Math.PI/2;
   n.forEach((v,i)=>{if(!v)return;const angle=2*Math.PI*v/total;ctx.beginPath();ctx.arc(450,525,205,start,start+angle);ctx.arc(450,525,115,start+angle,start,true);ctx.closePath();ctx.fillStyle=colors[i];ctx.fill();start+=angle;});
   drawText(String(total),408,530,65,'#ffffff',700);drawText('alegações',390,570,24,'#ffffff');
   n.forEach((v,i)=>{const y=380+i*92;ctx.fillStyle=colors[i];ctx.fillRect(800,y-20,27,27);drawText(labels[i],850,y,28);drawText(v+' ('+(100*v/total).toFixed(1).replace('.',',')+'%)',850,y+37,27,'#cbdcec');});
 }
 ctx.strokeStyle='#49647e';ctx.beginPath();ctx.moveTo(80,766);ctx.lineTo(1520,766);ctx.stroke();
 drawText('Distribuição descritiva: não demonstra intenção de enganar.',80,812,27);
 drawText('Conferir fontes, critérios e limites no laudo original. • RASTRO 2026',80,855,23,'#b8cadb');
 ready=true;btn.disabled=false;msg.textContent='Prévia pronta. Total: '+total+'. Confira antes de divulgar.';
}
document.getElementById('rastro-chart-render').addEventListener('click',render);
btn.addEventListener('click',()=>{if(!ready||!validatedReport)return;cv.toBlob(blob=>{if(!blob){msg.textContent='Falha ao gerar o PNG.';return;}const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='RASTRO_Resultados_'+new Date().toISOString().slice(0,10)+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);msg.textContent='PNG 1600 × 900 gerado.';},'image/png');});
})();
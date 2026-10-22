'use strict';
(()=>{
const $=id=>document.getElementById(id);
function contents(){
 const body=$('report')?.innerText?.trim()||'';
 if(!body||body.startsWith('O relatório aparecerá'))throw Error('Gere primeiro uma auditoria para exportar.');
 const source=$('reportSource');
 const title=source?.querySelector('strong')?.textContent||'MATERIAL ANALISADO';
 const file=source?.querySelector('div')?.textContent||'Material não identificado';
 const date=source?.querySelector('small')?.textContent||new Date().toLocaleString('pt-BR');
 const origin=source?.querySelector('a')?.href||'';
 const citations=[...document.querySelectorAll('#citations a')].map(a=>({name:a.textContent.trim(),url:a.href})).filter(a=>/^https?:/.test(a.url));
 const chart=$('rastro-chart-canvas');
 const image=chart&&chart.width&&chart.height&&chart.dataset.ready!=='false'?chart.toDataURL('image/png'):null;
 return {title,file,date,origin,body,citations,image};
}
const notice=msg=>{const el=$('notice');if(el)el.textContent=msg;};
function filename(s,ext){return 'RASTRO_'+s.replace(/https?:\/\//g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,55)+'.'+ext}
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
function chartCanvas(data){
 const source=$('rastro-chart-canvas');
 if(source&&source.width&&source.height&&!($('rastro-chart-save')?.disabled))return source.toDataURL('image/png');
 const c=document.createElement('canvas');c.width=1200;c.height=440;const g=c.getContext('2d');g.fillStyle='#132540';g.fillRect(0,0,c.width,c.height);g.fillStyle='#f0cc87';g.font='bold 44px Arial';g.fillText('RASTRO | QUADRO DE ANÁLISE',48,88);g.fillStyle='#d8e6f5';g.font='26px Arial';g.fillText('Gráfico quantitativo ainda não validado',48,165);g.font='23px Arial';g.fillText('Gere o gráfico no painel visual antes de exportar.',48,220);g.fillText('Não há contagens factuais presumidas.',48,273);return c.toDataURL('image/png');
}
async function toPDF(){
 const d=contents(),pdfNS=window.jspdf;if(!pdfNS?.jsPDF)throw Error('A biblioteca PDF não carregou. Atualize a página e tente novamente.');
 const pdf=new pdfNS.jsPDF({unit:'mm',format:'a4'}),pageW=210,margin=17,bottom=280;let y=22;
 const line=(txt,size=10,color=[26,39,57])=>{pdf.setFont('helvetica','normal');pdf.setFontSize(size);pdf.setTextColor(...color);const blocks=pdf.splitTextToSize(String(txt),pageW-2*margin);for(const b of blocks){if(y>bottom){pdf.addPage();y=20}pdf.text(b,margin,y);y+=size*.46+1.1;}y+=3;};
 pdf.setFillColor(13,30,51);pdf.rect(0,0,pageW,15,'F');pdf.setTextColor(243,201,112);pdf.setFont('helvetica','bold');pdf.setFontSize(15);pdf.text('RASTRO — LAUDO DOCUMENTAL',margin,10);
 line(d.title,13);line(d.file,12);line(d.date,9);if(d.origin)line('Origem: '+d.origin,8);
 const img=chartCanvas(d);if(y+64>bottom){pdf.addPage();y=20}pdf.addImage(img,'PNG',margin,y,176,64);y+=72;
 line('RELATÓRIO E ANÁLISE',13,[20,57,98]);
 d.body.split(/\n/).forEach(p=>line(p||' ',10));
 line('FONTES E REFERÊNCIAS',13,[20,57,98]);
 if(!d.citations.length)line('Nenhuma fonte com URL foi anexada ao relatório.',9);
 for(const c of d.citations){const text=c.name||c.url;const pieces=pdf.splitTextToSize(text,pageW-2*margin);for(const piece of pieces){if(y>bottom){pdf.addPage();y=20}pdf.setTextColor(22,79,150);pdf.setFontSize(9);pdf.textWithLink(piece,margin,y,{url:c.url});y+=5.2}y+=2;}
 line('Laudo preliminar sujeito à revisão humana. O gráfico deve ser validado antes da publicação.',8);
 const pageCount=pdf.getNumberOfPages();for(let i=1;i<=pageCount;i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(100,110,120);pdf.text('RASTRO • Página '+i+' de '+pageCount,margin,289)}
 pdf.save(filename(d.file,'pdf'));
}
async function toDOCX(){
 const d=contents(),D=window.docx;if(!D?.Document||!D.Packer)throw Error('A biblioteca DOCX não carregou. Atualize a página e tente novamente.');
 const {Paragraph,TextRun,ImageRun,Document,Packer,HeadingLevel,ExternalHyperlink}=D;
 const p=(text,bold=false)=>new Paragraph({children:[new TextRun({text:String(text),bold,size:22})],spacing:{after:140}});
 const heading=text=>new Paragraph({text,heading:HeadingLevel.HEADING_2,spacing:{before:230,after:140}});
 const pic=chartCanvas(d),bytes=Uint8Array.from(atob(pic.split(',')[1]),c=>c.charCodeAt(0));
 const body=[
 new Paragraph({text:'RASTRO — LAUDO DOCUMENTAL',heading:HeadingLevel.TITLE}),
 p(d.title,true),p(d.file,true),p(d.date),...(d.origin?[p('Origem: '+d.origin)]:[]),
 new Paragraph({children:[new ImageRun({data:bytes,transformation:{width:510,height:187},type:'png'})],spacing:{after:220}}),
 heading('RELATÓRIO E ANÁLISE'),
 ...d.body.split(/\n/).map(l=>p(l||' ')),
 heading('FONTES E REFERÊNCIAS'),
 ...(d.citations.length?d.citations.map(c=>new Paragraph({children:[new ExternalHyperlink({link:c.url,children:[new TextRun({text:c.name||c.url,style:'Hyperlink'})]})],spacing:{after:110}})):[p('Nenhuma fonte com URL foi anexada ao relatório.')]),
 p('Laudo preliminar sujeito à revisão humana. Valide os números do gráfico antes de divulgar.')
 ];
 const doc=new Document({sections:[{properties:{page:{margin:{top:900,bottom:900,left:900,right:900}}},children:body}]});
 const blob=await Packer.toBlob(doc);download(blob,filename(d.file,'docx'));
}
for(const [id,fn] of [['exportPdf',toPDF],['exportDocx',toDOCX]]){
 const button=$(id);if(!button)continue;
 button.addEventListener('click',async()=>{button.disabled=true;const old=button.textContent;button.textContent='⏳ Preparando...';try{await fn();notice('Documento gerado. Confira o gráfico e as fontes antes de publicar.')}catch(e){notice('Não foi possível gerar o arquivo: '+e.message)}finally{button.textContent=old;button.disabled=false}})
}
})();
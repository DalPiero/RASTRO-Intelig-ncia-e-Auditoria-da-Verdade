'use strict';(()=>{const form=document.getElementById('voucherForm'),reply=document.getElementById('voucherResponse'),btn=document.getElementById('voucherSend');if(!form)return;form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;btn.disabled=true;reply.textContent='Registrando solicitação...';const data=Object.fromEntries(new FormData(form).entries());try{const r=await fetch('/api/vouchers/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),d=await r.json();if(!r.ok)throw Error(d.error||'Falha no envio');reply.textContent='Pedido nº '+d.requestId+' recebido. As regras serão anunciadas em breve. A solicitação não garante a concessão.';form.reset()}catch(err){reply.textContent='Não foi possível enviar: '+err.message}finally{btn.disabled=false}});document.getElementById('voucherList')?.addEventListener('click',async()=>{const code=prompt('Informe o código privado de administrador:');if(!code)return;const area=document.getElementById('voucherAdminResults');area.textContent='Carregando...';try{const r=await fetch('/api/admin/vouchers',{headers:{'X-RASTRO-ADMIN':code}}),d=await r.json();if(!r.ok)throw Error(d.error||'Acesso negado');area.replaceChildren();const p=document.createElement('p');p.textContent=d.requests.length+' solicitações mais recentes:';area.append(p);for(const item of d.requests){const card=document.createElement('article');card.className='voucher-entry';for(const line of ['#'+item.id+' — '+item.applicant_name+' ('+item.category+')',item.email,item.organization||'Sem instituição informada',item.purpose,'Situação: '+item.status+' | '+new Date(item.created_at).toLocaleString('pt-BR')]){const div=document.createElement('div');div.textContent=line;card.append(div)}area.append(card)}}catch(err){area.textContent='Erro: '+err.message}})
const allButton=document.getElementById('voucherAllButton'),allStatus=document.getElementById('voucherAllStatus'),allResults=document.getElementById('voucherAllResults');
if(allButton)allButton.addEventListener('click',async()=>{
 const admin=prompt('Informe o código privado de administrador para consultar as solicitações:');
 if(!admin)return;
 allButton.disabled=true;allStatus.textContent='Consultando solicitações de todos os formulários...';allResults.replaceChildren();
 try{
  const response=await fetch('/api/admin/vouchers/all',{headers:{'X-RASTRO-ADMIN':admin}});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Falha na consulta');
  const config=[['individual2h','Voucher individual — 2 horas'],['academico','Acadêmico'],['institucional','Institucional'],['jornalista','Jornalistas'],['autoridade','Autoridades'],['cientista','Cientistas']];
  let total=0;
  for(const [key,label] of config){
   const rows=data.groups?.[key]||[];total+=rows.length;
   const section=document.createElement('details');section.open=rows.length>0;section.className='voucher-entry';
   const heading=document.createElement('summary');heading.textContent=label+' — '+rows.length+' solicitação(ões)';section.append(heading);
   const counters=document.createElement('p');
   counters.textContent='Pendentes: '+rows.filter(x=>x.status==='pending').length+' | Aprovadas: '+rows.filter(x=>x.status==='approved').length+' | Recusadas: '+rows.filter(x=>x.status==='denied').length;
   section.append(counters);
   if(!rows.length){const empty=document.createElement('p');empty.textContent='Nenhum pedido nesta modalidade.';section.append(empty)}
   for(const entry of rows){
    const item=document.createElement('article');item.className='voucher-entry';
    const dataLines=['Pedido #'+entry.id+' | '+entry.applicant_name+' | '+entry.status,
    'E-mail: '+entry.email,
    ...(entry.organization?['Instituição: '+entry.organization]:[]),
    'Finalidade: '+entry.purpose,
    'Recebido em: '+new Date(entry.created_at).toLocaleString('pt-BR'),
    ...(entry.expires_at?['Validade até: '+new Date(entry.expires_at).toLocaleString('pt-BR')]:[])];
    for(const line of dataLines){const p=document.createElement('p');p.textContent=line;item.append(p)}
    if(key==='individual2h'&&entry.status==='pending'){
     for(const approve of [true,false]){
      const action=document.createElement('button');action.type='button';action.className=approve?'primary':'quiet';action.textContent=approve?'Aprovar 2 horas':'Recusar';
      action.addEventListener('click',async()=>{
       if(!confirm((approve?'Aprovar':'Recusar')+' pedido #'+entry.id+'?'))return;
       action.disabled=true;
       try{const answer=await fetch('/api/admin/voucher2/decide',{method:'POST',headers:{'Content-Type':'application/json','X-RASTRO-ADMIN':admin},body:JSON.stringify({requestId:entry.id,approve})});
        const result=await answer.json();if(!answer.ok)throw Error(result.error||'Falha');
        item.querySelectorAll('button').forEach(button=>button.remove());
        const note=document.createElement('strong');note.textContent='Decisão registrada: '+result.status;item.append(note);
       }catch(e){alert('Não foi possível registrar decisão: '+e.message);action.disabled=false}
      });item.append(action)
     }
    }
    section.append(item)
   }
   allResults.append(section)
  }
  allStatus.textContent=total+' pedidos exibidos, separados por modalidade. '+(data.note||'');
 }catch(e){allStatus.textContent='Erro ao consultar: '+e.message}
 finally{allButton.disabled=false}
});
})();
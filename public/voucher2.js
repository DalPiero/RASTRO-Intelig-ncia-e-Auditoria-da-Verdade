'use strict';
(()=>{
 const $=id=>document.getElementById(id),feedback=$('voucher2Feedback'),view=$('voucher2AdminView');
 if(!feedback)return;
 const deviceKey='rastro_voucher2_device',idKey='rastro_voucher2_id';
 function device(){let id=localStorage.getItem(deviceKey);if(!/^rv2_[a-f0-9]{64}$/.test(id||'')){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  id='rv2_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  localStorage.setItem(deviceKey,id);
 }return id}
 async function api(url,method,body,admin){
  const r=await fetch(url,{method,headers:{'Content-Type':'application/json',...(admin?{'X-RASTRO-ADMIN':admin}:{'X-RASTRO-DEVICE':device()})},...(body?{body:JSON.stringify(body)}:{})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Falha HTTP '+r.status);return d
 }
 $('voucher2Request').onclick=async()=>{
  const button=$('voucher2Request');if(!$('voucher2Consent').checked){feedback.textContent='É necessário aceitar o tratamento dos dados para realizar a solicitação.';return}
  button.disabled=true;feedback.textContent='Registrando seu pedido...';
  try{const d=await api('/api/voucher2/request','POST',{name:$('voucher2Name').value.trim(),email:$('voucher2Email').value.trim(),purpose:$('voucher2Purpose').value.trim()});
   localStorage.setItem(idKey,String(d.requestId));feedback.textContent='Pedido nº '+d.requestId+' recebido. PENDENTE de aprovação exclusiva do administrador. Use este mesmo navegador para consultar.';
  }catch(e){feedback.textContent='Solicitação não concluída: '+e.message}finally{button.disabled=false}
 };
 $('voucher2Status').onclick=async()=>{
  const id=Number(localStorage.getItem(idKey));if(!id){feedback.textContent='Este navegador ainda não registrou solicitação. Crie seu pedido acima.';return}
  try{const d=await api('/api/voucher2/status','POST',{requestId:id});
   if(d.active){sessionStorage.setItem('rastro_mode','paid');sessionStorage.setItem('rastro_token',device());feedback.textContent='Voucher APROVADO e ativado neste navegador. Válido até '+new Date(d.expiresAt).toLocaleString('pt-BR')+'. Não compartilhe nem mude de navegador.'}
   else{if(sessionStorage.getItem('rastro_token')===device()){sessionStorage.removeItem('rastro_token');sessionStorage.removeItem('rastro_mode')}
    feedback.textContent=d.status==='pending'?'Pedido nº '+id+' aguardando autorização do administrador.':'Situação do pedido: '+d.status+'. Não há acesso ativo.'}
  }catch(e){feedback.textContent='Não foi possível consultar: '+e.message}
 };
 $('voucher2Admin').onclick=async()=>{
  const admin=prompt('Informe o código privado do administrador RASTRO:');if(!admin)return;
  view.replaceChildren();view.textContent='Consultando pedidos...';
  try{const d=await api('/api/admin/voucher2','GET',null,admin);view.replaceChildren();
   const pending=d.requests.filter(q=>q.status==='pending');
   const title=document.createElement('p');title.textContent=pending.length+' solicitação(ões) aguardando decisão.';view.append(title);
   for(const item of d.requests){const box=document.createElement('article');box.className='voucher-entry';
    const p=document.createElement('p');p.textContent='#'+item.id+' • '+item.applicant_name+' • '+item.email+' • '+item.status+' • '+new Date(item.created_at).toLocaleString('pt-BR');box.append(p);
    const purpose=document.createElement('p');purpose.textContent='Finalidade: '+item.purpose;box.append(purpose);
    if(item.status==='pending'){for(const approve of [true,false]){
     const b=document.createElement('button');b.type='button';b.className=approve?'primary':'quiet';b.textContent=approve?'Aprovar 2 horas':'Recusar';
     b.onclick=async()=>{if(!confirm((approve?'Aprovar':'Recusar')+' pedido #'+item.id+'?'))return;b.disabled=true;
      try{const result=await api('/api/admin/voucher2/decide','POST',{requestId:item.id,approve},admin);p.textContent='Pedido #'+item.id+' • '+result.status+(result.expiresAt?' • até '+new Date(result.expiresAt).toLocaleString('pt-BR'):'');box.querySelectorAll('button').forEach(x=>x.remove())}
      catch(e){p.textContent='Falha: '+e.message;b.disabled=false}};
     box.append(b);
    }}
    view.append(box);
   }
  }catch(e){view.textContent='Não foi possível consultar: '+e.message}
 };
 if(localStorage.getItem(idKey))feedback.textContent='Há uma solicitação registrada neste navegador (#'+localStorage.getItem(idKey)+'). Clique em “Conferir aprovação e ativar acesso”.';
})();

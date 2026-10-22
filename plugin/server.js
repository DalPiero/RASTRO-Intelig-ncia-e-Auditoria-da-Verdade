import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'300kb'}));
const HOME='https://rastro-intelig-ncia-e-auditoria-da.onrender.com/';
const PORT=Number(process.env.PORT||3100);
const CATEGORIES=['Mentira comprovada (exige prova de intenção)','Falsidade factual','Afirmação enganosa','Meia-verdade','Fora de contexto','Omissão relevante','Número impreciso','Generalização indevida','Falácia lógica','Falsa causalidade','Falsa equivalência','Contradição verificável','Sem evidências','Não verificável','Previsão como certeza','Enquadramento tendencioso','Apelo emocional','Seleção de dados','Atribuição indevida','Verdadeiro e contextualizado'];
function makeServer(){
 const mcp=new McpServer({name:'rastro-evidence-audit',version:'0.1.0'});
 mcp.registerTool('rastro_protocol',{description:'Consultar as 20 categorias do protocolo RASTRO e as regras de verificação responsável. Não gera vereditos automáticos.',inputSchema:{}},async()=>({content:[{type:'text',text:JSON.stringify({title:'RASTRO — Protocolo de investigação documental',categories:CATEGORIES.map((name,i)=>({code:String(i+1).padStart(2,'0'),name})),rules:['Separar fatos, opiniões, previsões e interpretações','Requerer evidências primárias e contexto','Não atribuir intenção de mentir sem prova','Registrar limitações e revisão humana'],site:HOME},null,2)}]}));
 mcp.registerTool('rastro_prepare_review',{description:'Preparar uma pauta de verificação neutra a partir de texto fornecido. Não faz pesquisa na web nem classifica afirmações como verdadeiras ou falsas.',inputSchema:{text:z.string().min(15).max(12000),source_url:z.string().url().optional()}},async({text,source_url})=>{
  const lines=text.replace(/\r/g,'').split(/(?<=[.!?])\s+|\n+/u).map(x=>x.trim()).filter(x=>x.length>=18).slice(0,25);
  const claims=lines.map((quote,index)=>({item:index+1,excerpt:quote.slice(0,450),verification_questions:['Qual fonte primária sustenta esta afirmação?','Qual data e contexto se aplicam?','O enunciado é fato verificável, previsão ou opinião?']}));
  return {content:[{type:'text',text:JSON.stringify({status:'pauta preliminar não verificada',source:source_url||'texto fornecido',claims,limitations:'Nenhuma pesquisa documental foi executada; não são atribuídos vereditos. Para auditoria completa e arquivos consulte o site RASTRO.',site:HOME},null,2)}]};
 });
 mcp.registerTool('rastro_open_site',{description:'Fornecer o link oficial da plataforma RASTRO para transcrição, auditorias e consulta acadêmica. Não envia arquivos automaticamente.',inputSchema:{}},async()=>({content:[{type:'text',text:JSON.stringify({url:HOME,description:'Site independente RASTRO. Serviços e regras de acesso disponíveis na página.'})}]}));
 return mcp;
}
app.get('/health',(_req,res)=>res.json({ok:true,service:'rastro-plugin',siteUnchanged:true}));
app.post('/mcp',async(req,res)=>{
 const server=makeServer();
 const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
 try{await server.connect(transport);await transport.handleRequest(req,res,req.body);}
 catch(e){console.error('MCP:',e?.message);if(!res.headersSent)res.status(500).json({error:'Falha na conexão MCP'})}
 finally{res.on('close',()=>{transport.close().catch(()=>{});server.close().catch(()=>{})})}
});
app.get('/mcp',(_req,res)=>res.status(405).set('Allow','POST').end());
app.delete('/mcp',(_req,res)=>res.status(405).set('Allow','POST').end());
app.listen(PORT,'0.0.0.0',()=>console.log('RASTRO plugin listening on '+PORT));

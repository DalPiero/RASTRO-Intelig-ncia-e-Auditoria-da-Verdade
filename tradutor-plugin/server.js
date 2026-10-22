import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'64kb'}));
const HOME='https://teaching-recipe-seagull.codepen.app/';
const PORT=Number(process.env.PORT||3100);
const icon=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="52" fill="#081a36"/><text x="27" y="193" font-size="190" font-family="Georgia,serif" font-weight="bold" fill="#f6c456">T</text><circle cx="175" cy="160" r="58" stroke="#f6c456" stroke-width="10" fill="#0079bd"/><path d="M117 160h116M175 102c-28 27-28 89 0 116M175 102c28 27 28 89 0 116M129 133h92M129 186h92" stroke="#bceefe" stroke-width="5" fill="none"/><path d="M112 185q65 62 137-42" stroke="#f6c456" stroke-width="9" fill="none"/></svg>`;
app.get('/favicon.svg',(_req,res)=>res.type('image/svg+xml').send(icon));
app.get('/health',(_req,res)=>res.json({ok:true,service:'tradutor-multilingue-plugin',siteUnchanged:true,version:'0.1.0'}));
function makeServer(){
 const mcp=new McpServer({name:'tradutor-multilingue-dal-piero',version:'0.1.0'});
 mcp.registerTool('tradutor_about',{description:'Informações verificadas do Tradutor Multilíngue Dal Piero, seus limites e formatos. Não alega tradução automática de documentos pelo plugin.',inputSchema:{}},async()=>({content:[{type:'text',text:JSON.stringify({name:'Tradutor Multilíngue — 60 Idiomas',site:HOME,webApp:{sourceFormats:['PDF','DOCX','EPUB','ODT','TXT','Markdown','HTML','RTF'],projectLimit:'até 2.000 páginas, sujeito ao provedor e aos recursos disponíveis',features:['tradução página a página','preservação aproximada de formatação','revisão','exportação','prompt visual de imagens','rascunho jurídico sem fé pública']},plugin:{version:'0.1.0',features:['consulta às instruções','abertura do aplicativo','tradução curta somente mediante consentimento explícito para um serviço externo'],limitations:'A integração não importa documentos, não mantém projetos e não garante os 60 pares de idiomas.'},credit:'Concepção e curadoria: Professor Doutor Fernando Antonio Dal Piero'},null,2)}]}));
 mcp.registerTool('tradutor_open_app',{description:'Fornece link do Tradutor Multilíngue para trabalhos longos, PDFs, DOCX, EPUB e exportação.',inputSchema:{}},async()=>({content:[{type:'text',text:JSON.stringify({url:HOME,tip:'Abra o site em seu navegador para escolher documento, idioma, provedor e exportação.'})}]}));
 mcp.registerTool('tradutor_translate_short',{description:'Traduz uma frase curta usando o serviço EXTERNO MyMemory. REQUER consentimento explícito: o texto será transmitido ao provedor externo. Suporta apenas pares aceitos pelo provedor; não utiliza os 60 idiomas do aplicativo como promessa de cobertura.',inputSchema:{text:z.string().min(1).max(450),source:z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/),target:z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/),consent_to_external_transfer:z.boolean().describe('Verdadeiro somente depois do usuário autorizar o envio do trecho ao serviço externo MyMemory.') }},async({text,source,target,consent_to_external_transfer})=>{
  if(!consent_to_external_transfer)return {isError:true,content:[{type:'text',text:'Consentimento obrigatório antes do envio a um terceiro. Alternativamente, use a tradução nativa do ChatGPT ou abra o aplicativo.'}]};
  try{
   const u=new URL('https://api.mymemory.translated.net/get');u.searchParams.set('q',text);u.searchParams.set('langpair',source+'|'+target);
   const signal=AbortSignal.timeout(12000);
   const response=await fetch(u,{signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw new Error('Provedor indisponível ('+response.status+')');
   const data=await response.json();const translated=data?.responseData?.translatedText;
   if(typeof translated!=='string'||!translated.trim()||Number(data?.responseStatus||200)>=400)throw new Error('Par de idiomas não aceito ou resultado indisponível');
   return {content:[{type:'text',text:JSON.stringify({source,target,original:text,translatedText:translated,provider:'MyMemory (externo ao CodePen/ChatGPT)',disclaimer:'Tradução automática: revisar nomes próprios, termos jurídicos e técnicos. O texto foi enviado ao provedor externo.'})}]};
  }catch(e){return {isError:true,content:[{type:'text',text:'Não foi possível traduzir pelo serviço externo: '+e.message+'. Use a tradução diretamente no ChatGPT ou o aplicativo '+HOME}]}};
 });
 return mcp;
}
app.post('/mcp',async(req,res)=>{
 const server=makeServer();
 const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
 let cleaned=false;
 const cleanup=()=>{if(cleaned)return;cleaned=true;void Promise.allSettled([transport.close(),server.close()]);};
 res.once('close',cleanup);
 try{await server.connect(transport);await transport.handleRequest(req,res,req.body);}
 catch(e){console.error('MCP error',e?.message);if(!res.headersSent)res.status(500).json({jsonrpc:'2.0',error:{code:-32603,message:'Falha interna MCP'},id:null});cleanup();}
});
app.get('/mcp',(_req,res)=>res.status(405).set('Allow','POST').end());
app.delete('/mcp',(_req,res)=>res.status(405).set('Allow','POST').end());
app.listen(PORT,'0.0.0.0',()=>console.log('Tradutor MCP listening on '+PORT));

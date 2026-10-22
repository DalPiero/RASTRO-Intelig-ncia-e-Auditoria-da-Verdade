# RASTRO Plugin — MVP independente

Este é um servidor MCP separado do site principal. **Não modifica o código nem o deploy do website RASTRO**.

## Capacidades iniciais
- `rastro_protocol`: protocolo com 20 categorias e princípios metodológicos.
- `rastro_prepare_review`: organiza uma pauta preliminar de checagem, sem emitir vereditos ou pesquisar a web.
- `rastro_open_site`: apresenta a URL oficial do RASTRO.

**Importante:** a primeira versão não executa a auditoria paga nem recebe tokens administrativos; operações sensíveis dependerão de autenticação individual (OAuth) e testes separados.

## Deploy separado no Render
Crie um *novo* serviço Web, a partir do mesmo repositório, com:
- Root Directory: `plugin`
- Build Command: `npm install`
- Start Command: `npm start`
- URL de MCP: `https://<seu-novo-servico>.onrender.com/mcp`

Não substitua o serviço principal do RASTRO. O serviço novo poderá ter custo próprio conforme o plano escolhido.

## Testes
Rode `npm install` e `npm run check`, depois o MCP Inspector com a URL `/mcp`.
Verifique inicialização, listagem das três ferramentas e chamadas reais antes de conectar ao ChatGPT.

## Instalação no ChatGPT
Plugins → Adicionar servidor MCP personalizado → URL do serviço **novo** /mcp → Criar plugin → instalar em ambiente pessoal. Publicação no diretório público exige revisão e aprovação.

Documentação: https://developers.openai.com/plugins/quickstart

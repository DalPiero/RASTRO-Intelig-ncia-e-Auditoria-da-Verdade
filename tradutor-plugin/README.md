# Tradutor Multilíngue — Plugin MCP para ChatGPT (MVP)

Aplicativo original: https://teaching-recipe-seagull.codepen.app/

Este serviço MCP está na pasta `tradutor-plugin`, separado do site RASTRO e do aplicativo CodePen. **Nenhum dos dois é alterado**.

## Funções
- `tradutor_about`: capacidades do aplicativo web e limites do plugin.
- `tradutor_open_app`: abre o site original para documentos extensos.
- `tradutor_translate_short`: traduz até 450 caracteres por solicitação com MyMemory. Requer consentimento explícito para transmitir o texto a um provedor terceiro. Não envie dados pessoais, sigilosos ou documentos protegidos.

## Deploy no Render — serviço NOVO
Repositório: `DalPiero/RASTRO-Intelig-ncia-e-Auditoria-da-Verdade`
Branch: `main`
Root Directory: `tradutor-plugin`
Build Command: `npm install`
Start Command: `npm start`

Não altere o Web Service do RASTRO e não publique credenciais.

Teste `https://ENDERECO-DO-NOVO-SERVICO/health` e conecte `https://ENDERECO-DO-NOVO-SERVICO/mcp` ao ChatGPT. O status Live não demonstra sozinho a conclusão da negociação MCP; utilize um inspetor MCP.

## Ícone
O favicon SVG é servido em `/favicon.svg`. Uma imagem PNG quadrada é disponibilizada em separado, para upload no perfil do plugin.

## Transparência
O site tem recursos para 60 idiomas/2.000 páginas, conforme descrito pelo próprio aplicativo. O plugin MVP **não reproduz essas capacidades**, não preserva arquivos nem exporta DOCX ou PDF diretamente. A API pública MyMemory possui disponibilidade e cobertura próprias.

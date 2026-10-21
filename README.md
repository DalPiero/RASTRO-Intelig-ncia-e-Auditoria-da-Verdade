# RASTRO · Site de auditoria documental

## Instalação (Node.js 20+)
1. Instale Node.js 20+ e FFmpeg (executável `ffmpeg` no PATH).
2. Na pasta do projeto: `npm install`.
3. Copie `.env.example` para `.env` e defina `OPENAI_API_KEY` **somente no servidor**.
4. Execute `npm start`; abra `http://localhost:3000`.

## Recursos
- URL de fonte; mídia local; texto; importação de SRT/VTT/TXT
- Transcrição de mídia com o modelo de diarização e tempos por segmento
- Divisão do áudio com FFmpeg em trechos de 9 minutos
- 20 critérios selecionáveis
- Pesquisa documental via Responses API e ferramenta `web_search`; links de fontes
- Cópia e exportação de relatório TXT

## Limitações importantes
- URL de rede social não baixa nem transcreve conteúdo automaticamente, pois plataformas exigem APIs/autorização.
- A identificação de falantes é por trecho de áudio de 9 minutos; uma mesma pessoa pode receber IDs diferentes entre trechos. Não representa identificação biométrica de uma pessoa.
- O serviço de diarização atualmente empregado é legado e tem data de descontinuação publicada. Planeje migração antes de 26/02/2027.
- Até 180 minutos depende dos limites de tamanho e memória do servidor. Hospedagem sem persistência ou com timeout curto pode falhar. A implementação faz o processamento durante uma única requisição, não oferece fila, autenticação nem quotas.
- O limite por chamada da análise é de 45.000 caracteres; faça análise em blocos para textos longos. Não verifique alegações pelo simples número de ocorrências.
- O site usa API paga. Respostas automáticas não substituem investigação humana. O modelo de pesquisa e a disponibilidade de ferramentas podem variar conforme a conta.
- Não publique sem autenticação, limites de requisição, proteção antispam, rate limiting, política de privacidade e hospedagem apropriada; uploads em memória são especialmente exigentes.

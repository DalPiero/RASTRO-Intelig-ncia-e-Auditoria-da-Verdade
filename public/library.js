"use strict";
(()=>{
const books=[["A TERRA SOB ACUSAÇÃO","Sociedade e política",1,"Romance sobre o meio rural, economia e relações sociais."],["BRASIL 2026","Sociedade e política",1,"Reflexões e debates sobre o Brasil contemporâneo."],["O HOMEM QUE MORREU COM A INTERNET","Tecnologia e futuro",1,"Ficção sobre tecnologia, memória e relações humanas."],["O PRIMEIRO DIA DEPOIS","Literatura e ficção",1,"Obra literária disponível no catálogo da editora."],["Brasil Levado ao Erro","Sociedade e política",1,"Discussão sobre os rumos e desafios nacionais."],["Brasil Gestação de Poder Permanente","Sociedade e política",1,"Tema relacionado à formação e permanência do poder."],["Tradução do Caos da IA — Avançado","Tecnologia e futuro",1,"Questões ligadas à inteligência artificial."],["A NOIVA QUE NÃO PERDOOU","Literatura e ficção",1,"Obra literária disponível no catálogo da editora."],["O ABC da Compreensão","Educação e conhecimento",1,"Reflexões sobre compreensão e conhecimento."],["Lições do Brasil","Sociedade e política",1,"Lições e questões sobre a realidade brasileira."],["Filosofia Fácil Recomendações Psicofônicas dos Grandes Estoicos","Filosofia",1,"Pensamento filosófico e referências ao estoicismo."],["Última Chamada","Literatura e ficção",1,"Obra disponível no catálogo da editora."],["Entre Frascos e Versos: na Farmácia da Existência","Poesia",1,"Poesia e reflexões sobre a existência."],["Tendências e Megatendências para Década","Tecnologia e futuro",1,"Análise de tendências e transformações."],["Axiomas de A até Z","Filosofia",1,"Máximas e proposições para reflexão."],["Poesias Tácteis","Poesia",1,"Obra poética disponível no catálogo da editora."],["Poesias e Frases Transformadoras","Poesia",1,"Poesias e frases de caráter reflexivo."],["O Livro da Criação","Filosofia",1,"Reflexões associadas ao tema da criação."],["A mente colaborativa","Educação e conhecimento",1,"Tema da cooperação e da atividade intelectual."],["2026 — O Ano de Fazer o Tempo Viver","Filosofia",1,"Reflexões sobre tempo e vida."],["Conversas Odontológicas: Um Guia de Script","Educação e conhecimento",1,"Comunicação aplicada ao contexto odontológico."],["Guia de 10 Etapas para Encantar pessoas e Fazer Cliente Feliz","Negócios",1,"Comunicação e atendimento ao cliente."],["20ª Edição Poesias para Negócios e Vida","Poesia",1,"Versos relacionados à vida e aos negócios."],["3ª Edição Brasil Meditar para Sucesso e Progresso","Filosofia",1,"Meditação, progresso e desenvolvimento pessoal."]];
const root=document.getElementById('bibGrid');if(!root)return;
const q=document.getElementById('bibSearch'),t=document.getElementById('bibTopic'),p=document.getElementById('bibProgram'),count=document.getElementById('bibCount');
const publisher='https://clubedeautores.com.br/livros/autores/giacomo-nerone-pseudonimo-de-del-piero?page=';
const themes=[...new Set(books.map(b=>b[1]))].sort((a,b)=>a.localeCompare(b,'pt-BR'));themes.forEach(x=>{let o=document.createElement('option');o.value=x;o.textContent=x;t.append(o)});
function make(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function link(url,label){let a=make('a','bib-link',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a}
function norm(x){return String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function card(b){
const el=make('article','bib-card'),cover=make('div','bib-cover'),cap=make('span','bib-cover-title',b[0]),desc=make('p','bib-desc',b[3]),meta=make('div','bib-meta',b[1]);
cover.setAttribute('role','img');cover.setAttribute('aria-label','Capa tipográfica ilustrativa: '+b[0]);cover.append(make('small','','CURADORIA DAL PIERO'),cap,make('small','','CAPA ILUSTRATIVA'));
el.append(cover,make('h3','',b[0]),meta,desc,link(publisher+b[2],'Consultar edição na editora ↗'));return el
}
const access={preco:['Programa Você Faz o Preço','https://bit.ly/Voc%C3%AAfazoPre%C3%A7o','Consulte os títulos disponíveis no programa externo.'],livros:['Livros e promoções','https://bit.ly/promo1026livros','Acesse o catálogo externo para conhecer as opções.'],artigos:['Artigos de @fadalprofdr','https://x.com/fadalprofdr','Artigos e publicações na rede X.']};
function render(){
const term=norm(q.value.trim()),theme=t.value,program=p.value;root.replaceChildren();
if(program!=='todos'&&program!=='impresso'){
const info=access[program],el=make('article','bib-card bib-external');el.append(make('h3','',info[0]),make('p','bib-desc',info[2]),link(info[1],'Abrir acervo ↗'));root.append(el);count.textContent='A lista de títulos deste programa é gerida no destino externo.';return;
}
const filtered=books.filter(b=>(theme==='todos'||b[1]===theme)&&norm(b[0]+' '+b[1]+' '+b[3]).includes(term));
filtered.forEach(b=>root.append(card(b)));count.textContent=filtered.length+' títulos exibidos de '+books.length+' cadastrados no índice inicial.';
if(!filtered.length)root.append(make('p','bib-empty','Nenhum título encontrado. Tente outra palavra ou tema.'))
}
[q,t,p].forEach(el=>el.addEventListener('input',render));render();
})();
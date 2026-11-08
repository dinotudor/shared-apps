# What's for dinner? com a identidade SkiroLiro

Base: handoff do brainstorm e página do Notion (PRD, modelo de dados). O canvas original dos wireframes não pôde ser aberto.

Regra: "let's order" e "going out" geram um aviso no dia, sem mudar o plano.

## Conceito
App web mobile-first, lúdico, para a família planejar os jantares da semana. Cada dia tem um prato, "Skip dinner" ou "Free-style". Todos reagem com emojis, respondem e avisam o que falta. UI em português, código em inglês, sem comunicação externa no MVP.

## Telas
1. **Semana**: 7 dias (prato / Skip / Free-style), status e reações; dia vazio = "+ Planejar". Abas Semana e Pratos.
2. **Dia**: foto, quem planejou, alerta "Ingrediente faltando! Quem vai? 😄", aviso do dia, 4 respostas, checklist (tudo marcado), reações.
3. **Planejar o dia**: Skip dinner, Free-style ou prato salvo (busca, média, vezes feito, quem enjoou).
4. **Pratos**: busca, ordem (mais feitos, melhor nota, recentes), cards com média, minha nota e Enjoei.
5. **Prato**: nota 0–10 (rosto por faixa: 0–4, 5–7, 8–10), Enjoei (3 semanas), notas da família, ingredientes, preparo.
6. **Novo/editar prato**: foto, nome, ingredientes (nome + quantidade), preparo, salvar, excluir.

## Respostas (texto original mantido)
cant_wait "MMMM can't wait!" · lets_order "F*#% it, let's order!" · going_out "I'm in the mood for going out tonight ;)" · not_home "Not home tonight"
Versão "soft" prevista para o futuro (opção nas configurações).

## Identidade aplicada
- Azul para agir; verde para planejado, em casa e nota alta; âmbar só para ingrediente faltando e aviso do dia.
- Nota sempre com rosto + faixa + número, nunca só cor.
- Reações da família são emojis reais (conteúdo); a interface usa ícones de linha da marca.
- Os dois pontos do logo viram o sorriso de "decidido" e aparecem em vazio/carregando.
- Humor nas respostas, alerta, vazio e Enjoei; nunca em erro, sem rede e excluir.

## Enjoei (decidido)
Cada pessoa marca na tela Prato. O aviso ("Fulano enjoou") aparece em Planejar o dia e no detalhe do Dia, por 3 semanas.

## Fase 2 (previsto no desenho)
Mês (mesmo cartão de dia, menor), mensagens (3ª aba), estatísticas, lista de compras (nasce de "ingredientes faltando"), stickers na foto.

## Ícones
41 ícones em `icons/` (grade 24, traço 1.5) e `icons/sprite.svg`. Inclui notas (nota-enjoo, nota-neutro, nota-amei), enjoei, skip, freestyle, falta, respostas, reações e fase 2.

## Em aberto
- Versão soft (futura): escolha por família ou por pessoa?
- Quando aparece o "aviso do dia"?
- Reações: lista fixa ou qualquer emoji?

## Logo e ícone do app (v0 aprovado)
Aprovado por Dino em 2026-11-08, a refinar depois. Carinha pensativa desenhada (rosto menta, olhos brancos grandes, uma sobrancelha levantada, boca reta) com o nome em Figtree Bold. Arquivos em `brand/v0/` (lockups claro e escuro, marca, ícone de app 1024 px). Explorações descartadas em `brand/explorations/`.

## Identidade final (2026-11-08)
- Paleta B, Verde de feira: ação em verde (#0F7A5C claro / #4FE0B0 escuro), texto azul-marinho, fundos com leve tom verde, âmbar para atenção.
- Logo v0 (carinha pensativa) no cabeçalho e nos estados vazio/carregando; arquivos em `brand/v0/`.
- Ícones: 33 só de uso do app (`icons/`). Emojis para respostas, notas, reações e Enjoei.
- Wireframes finais, Play (protótipo clicável) e Guia de uso: `wireframes-finais.html` (e PNGs claro/escuro).
- Reações: qualquer emoji. Versão soft das respostas: por família, depois.
- Tokens em `tokens-wfd.css`.

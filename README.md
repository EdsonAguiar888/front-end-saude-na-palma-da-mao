# OrtoFisio+ | Front-end Web (MVP)

Ortopedia e Fisioterapia Ortopédica. Front-end em **HTML, CSS e JavaScript puro (módulos ES)**, PWA, mobile-first,
consumindo a API REST do back-end `backend-saude-na-palma-da-mao-express`.

## Executar localmente

Não há build nem dependências. Sirva a pasta por HTTP (módulos ES e service worker não funcionam em `file://`):

```bash
python3 -m http.server 5500
# abra http://localhost:5500
```

A URL da API fica em `js/config.js`. Todos os caminhos são relativos (funciona no GitHub Pages).
Ao publicar nova versão, aumente `CACHE_VERSION` em `sw.js`.

## Estrutura (camadas)

```
js/core/      http (único ponto com fetch), session, guard, dom, datetime
js/mappers/   converte o JSON da API (snake_case, ids em string) para o formato do front
js/services/  uma função por operação da API; nunca tocam no DOM
js/ui/        componentes de interface
js/pages/     um controller por tela
css/          base.css (tokens da marca) e components.css
```

Fluxo de dependência: `pages -> services -> core/http` e `pages -> ui`.
Dados vindos da API entram na tela como texto (`textContent`), nunca como HTML.

## Estado do projeto

- [x] Etapa 1: base, PWA, identidade visual e tela inicial
- [ ] Etapa 2: login, cadastro e área do paciente
- [ ] Etapa 3: agendamento e painéis de profissional/administrador

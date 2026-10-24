# Como contribuir (front-end TriaOrto+)

Guia curto para o time de front-end (4 pessoas). Leia uma vez e siga sempre.

## Branches

| Branch | Para quê | Quem escreve nela |
|---|---|---|
| `main` | Versões estáveis e entregáveis. Cada entrega recebe uma tag (`v0.1`, `v0.2`…) | Só por Pull Request vindo da `develop` |
| `develop` | Integração: onde as tarefas se encontram e são testadas juntas | Só por Pull Request vindo de uma branch de tarefa |
| `feat/…`, `fix/…`, `docs/…`, `chore/…` | Uma tarefa pequena (de 1 a 4 telas) | Quem pegou a tarefa |

`main` e `develop` são protegidas: ninguém comita direto nelas, e todo Pull Request precisa de **1 aprovação de outra pessoa**.

### Nome das branches de tarefa

`tipo/modulo-assunto`, em minúsculas e com hífen:

- `feat/acesso-cadastro-figma`
- `feat/paciente-pre-triagem`
- `feat/profissional-agenda`
- `feat/admin-clinicas`
- `fix/login-cpf-mascara`
- `docs/contributing`
- `chore/sw-lista-de-arquivos`

## Fluxo de uma tarefa (GitHub Desktop)

1. Troque para a `develop` em **Current Branch** e clique em **Fetch origin** e depois **Pull origin**, para ter a versão mais recente.
2. **Current Branch > New Branch**, dê o nome da tarefa, deixe a base em `develop` e clique em **Create Branch**.
3. Trabalhe e comite com frequência, com mensagens claras (veja abaixo).
4. Clique em **Publish branch** para enviar.
5. Clique em **Create Pull Request**. No GitHub confira **base: `develop`** ← **compare: sua branch**, descreva o que mudou e peça revisão a um colega.
6. Depois de aprovado e unido (**Merge**), apague a branch e volte ao passo 1 para a próxima tarefa.

Branches devem viver pouco: **no máximo 2 a 3 dias**. Quanto mais tempo, mais conflito.

### Mensagens de commit

`tipo: o que mudou`, no imperativo e curto:

- `feat: tela de cadastro etapa 1 conforme Figma`
- `fix: aceitar CPF sem pontuação no login`
- `docs: explicar fluxo de branches`
- `chore: incluir novas páginas no sw.js`

## Pull Requests

- De 1 a 4 telas por PR. PR gigante ninguém revisa direito.
- Descreva o que mudou e anexe **uma captura de tela** (ou comparação com o Figma).
- Quem revisa: abre a branch, roda o app, confere com o Figma e comenta no código.
- Marque como resolvido cada comentário antes de unir.

## Entregas (`develop` → `main`)

Quando a `develop` estiver testada e estável: **Create Pull Request** de `develop` para `main`, aprovação de outra pessoa, merge e **tag** da versão. A `main` representa o que será entregue.

## Divisão por módulos (proposta, ajustar com a lista das 48 telas)

| Módulo | Exemplos de telas | Arquivos próprios |
|---|---|---|
| Acesso e perfil | cadastro, recuperar senha, perfil | `css/acesso.css`, `js/pages/…` |
| Paciente: atendimento | pré-triagem, agendamento, consultar, cancelar | `css/paciente.css` |
| Profissional | agenda, horários, atendimentos | `css/profissional.css` |
| Administrador e cadastros | clínicas, especialidades, profissionais | `css/admin.css` |

Cada pessoa é responsável por um módulo. Para não esbarrar nos colegas:

- Estilos de um módulo ficam no **CSS do módulo**. Só componentes usados em várias telas vão para `css/components.css`.
- Páginas novas: um `.html` na raiz e um controller em `js/pages/`.
- **Toda página ou arquivo novo precisa entrar na lista `SHELL` do `sw.js`**, senão o PWA não funciona offline.
- Ao mexer em arquivos compartilhados (`css/components.css`, `css/base.css`, `js/ui/layout.js`, `sw.js`), avise o grupo antes e faça PR pequeno.

## Regras do código

- HTML, CSS e JavaScript puro (módulos ES). Sem frameworks.
- Camadas: `pages -> services -> core/http`; `pages -> ui`. Só `core/http.js` chama `fetch`.
- Dados da API entram na tela como texto (`textContent`), nunca como HTML.
- Layout fiel ao Figma: use o SVG do quadro como referência de medidas e cores (veja `README.md`).
- Acessibilidade: campos com `label` (pode ser `sr-only`), alvos de toque de pelo menos 44 px, contraste legível.
- Nunca comite senhas, tokens ou arquivos `.zip`.

## Quando travar

Conflito de merge ou algo estranho no Git? Não force nada: chame alguém do time antes de apagar ou sobrescrever.

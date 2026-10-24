import { exigirLogin, PERFIS } from "../core/guard.js";
import { montarLayout, avisoDeErro } from "../ui/layout.js";
import { h, $, carregando, estadoVazio } from "../core/dom.js";
import { carregarCatalogo, nomesDasEspecialidades } from "../ui/catalogo.js";
import { formatarTelefone, apenasDigitos } from "../ui/mascaras.js";

async function iniciar(s) {
  montarLayout(s);
  const raiz = $("#conteudo");
  raiz.replaceChildren(h("h1", {}, "Clínicas parceiras"), carregando("Carregando clínicas..."));

  try {
    const cat = await carregarCatalogo();
    const conteudo = [h("h1", {}, "Clínicas parceiras")];

    if (cat.clinicas.length === 0) {
      conteudo.push(estadoVazio("Nenhuma clínica cadastrada no momento."));
    } else {
      conteudo.push(h("div", { class: "grade" }, cat.clinicas.map((c) => cartao(c, cat, s))));
    }
    raiz.replaceChildren(...conteudo);
  } catch (err) {
    raiz.replaceChildren(h("h1", {}, "Clínicas parceiras"), avisoDeErro(err.message));
  }
}

function cartao(c, cat, s) {
  const ids = cat.clinEsp.filter((x) => x.idClinica === c.id).map((x) => x.idEspecialidade);
  const especialidades = nomesDasEspecialidades(cat, ids);
  const tel = apenasDigitos(c.telefone);

  return h(
    "article",
    { class: "card" },
    h("h2", {}, c.nome),
    h("p", { class: "card__meta" }, c.endereco || "Endereço não informado"),
    especialidades ? h("p", {}, h("strong", {}, "Especialidades: "), especialidades) : null,
    tel ? h("p", { class: "card__meta" }, "Telefone: ", h("a", { href: `tel:${tel}` }, formatarTelefone(tel))) : null,
    s.tipo === PERFIS.PACIENTE
      ? h(
          "div",
          { class: "card__acoes" },
          h("a", { class: "btn", href: `agendamento.html?clinica=${c.id}` }, "Agendar nesta clínica"),
        )
      : null,
  );
}

// Inicia só depois de todas as declarações do módulo (evita acessar let/const antes da inicialização).
const sessao = exigirLogin();
if (sessao) iniciar(sessao);

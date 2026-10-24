import { exigirLogin, PERFIS } from "../core/guard.js";
import { montarLayout, avisoDeErro } from "../ui/layout.js";
import { h, $, carregando, estadoVazio, toast, comBotaoOcupado } from "../core/dom.js";
import { carregarCatalogo, nomesDasEspecialidades } from "../ui/catalogo.js";
import { profissionalService } from "../services/profissionalService.js";
import { aplicarMascara, formatarCPF, formatarTelefone, apenasDigitos, validarCampoCPF } from "../ui/mascaras.js";

let cat = null;

async function iniciar(s) {
  montarLayout(s);
  prepararFormulario();
  await recarregar();
}

async function recarregar() {
  const raiz = $("#conteudo");
  const titulo = h(
    "div",
    { class: "pagina-titulo" },
    h("h1", {}, "Profissionais"),
    h("button", { class: "btn", type: "button", onclick: abrirDialogo }, "Novo profissional"),
  );
  raiz.replaceChildren(titulo, carregando("Carregando profissionais..."));

  try {
    cat = await carregarCatalogo({ incluirInativos: true });
    const lista = cat.profissionais;
    raiz.replaceChildren(
      titulo,
      lista.length === 0
        ? estadoVazio("Nenhum profissional cadastrado ainda.")
        : h("div", { class: "grade" }, lista.map(cartao)),
    );
  } catch (err) {
    raiz.replaceChildren(titulo, avisoDeErro(err.message));
  }
}

function cartao(p) {
  const clinicas = cat.vinculos
    .filter((v) => v.idProfissional === p.id)
    .map((v) => cat.clinicaPorId.get(v.idClinica)?.nome)
    .filter(Boolean)
    .join(", ");
  const ids = cat.profEsp.filter((x) => x.idProfissional === p.id).map((x) => x.idEspecialidade);

  const botao = h(
    "button",
    { class: "btn btn--secundario btn--pequeno", type: "button" },
    p.ativo ? "Desativar" : "Ativar",
  );
  botao.addEventListener("click", async () => {
    try {
      await comBotaoOcupado(botao, "Salvando...", () => profissionalService.alterarAtivo(p.id, !p.ativo));
      toast(p.ativo ? "Profissional desativado." : "Profissional ativado.", "sucesso");
      await recarregar();
    } catch (err) {
      toast(err.message, "erro");
    }
  });

  return h(
    "article",
    { class: "card" },
    h("h2", {}, p.nome),
    h("p", { class: "card__meta" }, `${p.conselho} ${p.registro}/${p.uf}`),
    h("p", {}, h("span", { class: `etiqueta etiqueta--${p.ativo ? "ATIVO" : "INATIVO"}` }, p.ativo ? "Ativo" : "Inativo")),
    clinicas ? h("p", {}, h("strong", {}, "Clínica: "), clinicas) : h("p", { class: "card__meta" }, "Sem clínica vinculada"),
    ids.length ? h("p", {}, h("strong", {}, "Especialidades: "), nomesDasEspecialidades(cat, ids)) : null,
    p.email ? h("p", { class: "card__meta" }, p.email) : null,
    h("div", { class: "card__acoes" }, botao),
  );
}

// ---------- Diálogo de cadastro ----------
const dlg = () => $("#dlg-prof");
const form = () => $("#form-prof");

function prepararFormulario() {
  aplicarMascara($("#p-cpf"), formatarCPF);
  aplicarMascara($("#p-telefone"), formatarTelefone);
  validarCampoCPF($("#p-cpf"));
  $("#p-cancelar").addEventListener("click", () => dlg().close());
  form().addEventListener("submit", enviar);
}

function abrirDialogo() {
  if (!cat) {
    toast("Aguarde o carregamento da lista.", "info");
    return;
  }
  form().reset();
  $("#p-uf").value = "PE";
  $("#p-erro").textContent = "";

  $("#p-clinica").replaceChildren(
    h("option", { value: "" }, "Selecione a clínica"),
    ...cat.clinicas.map((c) => h("option", { value: c.id }, c.nome)),
  );

  $("#p-especialidades").replaceChildren(
    ...cat.especialidades.map((e) =>
      h(
        "div",
        { class: "opcao-check" },
        h("input", { type: "checkbox", id: `esp-${e.id}`, name: "esp", value: e.id }),
        h("label", { for: `esp-${e.id}` }, e.nome),
      ),
    ),
  );

  dlg().showModal();
}

async function enviar(e) {
  e.preventDefault();
  const erro = $("#p-erro");
  erro.textContent = "";

  const f = form();
  const ids = [...f.querySelectorAll('input[name="esp"]:checked')].map((i) => Number(i.value));

  if (!f.checkValidity()) {
    const invalido = f.querySelector(":invalid");
    erro.textContent = invalido?.validationMessage || "Confira os campos destacados.";
    invalido?.focus();
    return;
  }
  if (ids.length === 0) {
    erro.textContent = "Marque ao menos uma especialidade.";
    return;
  }

  const d = Object.fromEntries(new FormData(f));
  try {
    await comBotaoOcupado($("button[type=submit]", f), "Cadastrando...", () =>
      profissionalService.cadastrarCompleto({
        usuario: {
          nome: d.nome.trim(),
          email: d.email.trim(),
          senha: d.senha,
          telefone: apenasDigitos(d.telefone),
        },
        profissional: {
          cpf: d.cpf,
          conselho: d.conselho,
          registro: d.registro.trim(),
          uf: d.uf.toUpperCase(),
        },
        idClinica: Number(d.clinica),
        idsEspecialidades: ids,
      }),
    );
    dlg().close();
    toast("Profissional cadastrado.", "sucesso");
    await recarregar();
  } catch (err) {
    erro.textContent = /unique|duplic|already|existe/i.test(err.message)
      ? "Já existe um cadastro com este e-mail ou CPF."
      : err.message;
  }
}

// Inicia só depois de todas as declarações do módulo (evita acessar let/const antes da inicialização).
const sessao = exigirLogin([PERFIS.ADMIN]);
if (sessao) iniciar(sessao);

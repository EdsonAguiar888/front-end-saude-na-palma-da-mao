import { exigirLogin, PERFIS } from "../core/guard.js";
import { montarLayout, avisoDeErro } from "../ui/layout.js";
import { h, $, carregando, estadoVazio, toast, comBotaoOcupado } from "../core/dom.js";
import { carregarCatalogo } from "../ui/catalogo.js";
import { disponibilidadeService } from "../services/disponibilidadeService.js";
import { confirmar } from "../ui/dialogo.js";
import { formatarData, gerarHorarios, hojeISO } from "../core/datetime.js";

let cat = null;
let vinculosPermitidos = [];
let janelas = [];
let eu = null;

const DURACOES = [15, 20, 30, 40, 45, 60];
const emMin = (t) => {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
};

async function iniciar(s) {
  eu = s;
  montarLayout(s);
  const raiz = $("#conteudo");
  raiz.replaceChildren(h("h1", {}, "Horários de atendimento"), carregando());

  try {
    cat = await carregarCatalogo();
    vinculosPermitidos =
      s.tipo === PERFIS.ADMIN ? cat.vinculos : cat.vinculos.filter((v) => v.idProfissional === s.idProfissional);

    if (vinculosPermitidos.length === 0) {
      raiz.replaceChildren(
        h("h1", {}, "Horários de atendimento"),
        h(
          "div",
          { class: "alerta alerta--aviso" },
          s.tipo === PERFIS.ADMIN
            ? "Cadastre um profissional vinculado a uma clínica para criar horários."
            : "Seu cadastro ainda não está vinculado a uma clínica. Procure a administração.",
        ),
      );
      return;
    }
    await desenhar();
  } catch (err) {
    raiz.replaceChildren(h("h1", {}, "Horários de atendimento"), avisoDeErro(err.message));
  }
}

async function desenhar() {
  const raiz = $("#conteudo");
  const todas = await disponibilidadeService.listar();
  const ids = new Set(vinculosPermitidos.map((v) => v.id));
  janelas = todas
    .filter((d) => ids.has(d.idVinculo) && d.data >= hojeISO())
    .sort((a, b) => `${a.data} ${a.horaInicio}`.localeCompare(`${b.data} ${b.horaInicio}`));

  raiz.replaceChildren(
    h("h1", {}, "Horários de atendimento"),
    formulario(),
    h("h2", { style: "margin-top:var(--espaco-4)" }, "Horários cadastrados"),
    janelas.length === 0 ? estadoVazio("Nenhum horário futuro cadastrado.") : tabela(),
  );
}

function formulario() {
  const erro = h("p", { class: "erro-form", role: "alert" });
  const selVinculo = h(
    "select",
    { id: "d-vinculo", name: "vinculo", required: true },
    vinculosPermitidos.map((v) => h("option", { value: v.id }, cat.rotuloVinculo(v.id))),
  );
  const campo = (rotulo, id, controle) =>
    h("div", { class: "campo" }, h("label", { for: id }, rotulo), controle);

  const f = h(
    "form",
    { class: "card formulario", novalidate: true },
    h("h2", {}, "Novo horário"),
    campo("Profissional e clínica", "d-vinculo", selVinculo),
    h(
      "div",
      { class: "campos-linha" },
      campo("Data", "d-data", h("input", { id: "d-data", name: "data", type: "date", required: true, min: hojeISO() })),
      campo("Início", "d-ini", h("input", { id: "d-ini", name: "ini", type: "time", required: true, value: "08:00" })),
      campo("Fim", "d-fim", h("input", { id: "d-fim", name: "fim", type: "time", required: true, value: "12:00" })),
      campo(
        "Duração da consulta",
        "d-dur",
        h(
          "select",
          { id: "d-dur", name: "dur", required: true },
          DURACOES.map((m) => h("option", { value: m, selected: m === 30 }, `${m} minutos`)),
        ),
      ),
    ),
    erro,
    h("button", { class: "btn", type: "submit" }, "Adicionar horário"),
  );

  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    erro.textContent = "";
    const d = Object.fromEntries(new FormData(f));

    if (!f.checkValidity()) {
      erro.textContent = "Preencha todos os campos.";
      return;
    }
    if (d.data < hojeISO()) {
      erro.textContent = "Escolha uma data de hoje em diante.";
      return;
    }
    if (emMin(d.fim) <= emMin(d.ini)) {
      erro.textContent = "O horário final precisa ser depois do inicial.";
      return;
    }
    const nova = { horaInicio: d.ini, horaFim: d.fim, duracaoMinutos: Number(d.dur) };
    if (gerarHorarios(nova).length === 0) {
      erro.textContent = "A janela é menor que a duração de uma consulta.";
      return;
    }
    const conflito = janelas.some(
      (j) =>
        j.idVinculo === Number(d.vinculo) &&
        j.data === d.data &&
        emMin(j.horaInicio) < emMin(d.fim) &&
        emMin(d.ini) < emMin(j.horaFim),
    );
    if (conflito) {
      erro.textContent = "Já existe um horário cadastrado que se sobrepõe a este.";
      return;
    }

    try {
      await comBotaoOcupado($("button[type=submit]", f), "Salvando...", () =>
        disponibilidadeService.criar({
          idVinculo: Number(d.vinculo),
          data: d.data,
          horaInicio: d.ini,
          horaFim: d.fim,
          duracaoMinutos: Number(d.dur),
        }),
      );
      toast("Horário adicionado.", "sucesso");
      await desenhar();
    } catch (err) {
      erro.textContent = err.message;
    }
  });
  return f;
}

function tabela() {
  const linhas = janelas.map((j) => {
    const bloqueado = j.status === "BLOQUEADO";
    const bTroca = h("button", { class: "btn btn--secundario btn--pequeno", type: "button" }, bloqueado ? "Liberar" : "Bloquear");
    bTroca.addEventListener("click", async () => {
      try {
        await comBotaoOcupado(bTroca, "Salvando...", () =>
          disponibilidadeService.alterarStatus(j.id, bloqueado ? "DISPONIVEL" : "BLOQUEADO"),
        );
        await desenhar();
      } catch (err) {
        toast(err.message, "erro");
      }
    });

    const bRemover = h("button", { class: "btn btn--perigo btn--pequeno", type: "button" }, "Remover");
    bRemover.addEventListener("click", async () => {
      if (!(await confirmar("Remover este horário de atendimento?", "Remover"))) return;
      try {
        await disponibilidadeService.remover(j.id);
        toast("Horário removido.", "sucesso");
        await desenhar();
      } catch (err) {
        toast(err.message, "erro");
      }
    });

    return h(
      "tr",
      {},
      h("td", { "data-rotulo": "Data" }, formatarData(j.data)),
      h("td", { "data-rotulo": "Horário" }, `${j.horaInicio} às ${j.horaFim} (${j.duracaoMinutos} min)`),
      eu.tipo === PERFIS.ADMIN ? h("td", { "data-rotulo": "Profissional" }, cat.rotuloVinculo(j.idVinculo)) : null,
      h("td", { "data-rotulo": "Situação" }, bloqueado ? "Bloqueado" : j.status === "RESERVADO" ? "Reservado" : "Disponível"),
      h("td", {}, h("div", { class: "card__acoes", style: "margin:0" }, bTroca, bRemover)),
    );
  });

  return h(
    "table",
    { class: "tabela" },
    h(
      "thead",
      {},
      h(
        "tr",
        {},
        h("th", { scope: "col" }, "Data"),
        h("th", { scope: "col" }, "Horário"),
        eu.tipo === PERFIS.ADMIN ? h("th", { scope: "col" }, "Profissional") : null,
        h("th", { scope: "col" }, "Situação"),
        h("th", { scope: "col" }, "Ações"),
      ),
    ),
    h("tbody", {}, linhas),
  );
}

// Inicia só depois de todas as declarações do módulo (evita acessar let/const antes da inicialização).
const sessao = exigirLogin([PERFIS.PROFISSIONAL, PERFIS.ADMIN]);
if (sessao) iniciar(sessao);

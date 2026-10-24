// Assistente de agendamento: clínica -> especialidade -> profissional -> dia -> horário -> confirmar.
// Regras de negócio calculadas aqui porque a API não filtra nem valida conflitos.
import { exigirLogin, PERFIS } from "../core/guard.js";
import { montarLayout, avisoDeErro } from "../ui/layout.js";
import { h, $, carregando, estadoVazio, toast, comBotaoOcupado } from "../core/dom.js";
import { carregarCatalogo } from "../ui/catalogo.js";
import { disponibilidadeService } from "../services/disponibilidadeService.js";
import { agendamentoService } from "../services/agendamentoService.js";
import { formatarData, gerarHorarios, hojeISO, agoraHHMM } from "../core/datetime.js";

const ROTULOS = ["Clínica", "Especialidade", "Profissional", "Dia", "Horário", "Confirmação"];
const ORDEM = ["idClinica", "idEspecialidade", "idVinculo", "data", "hora"];

let eu, cat, disponibilidades, agendamentos;
const estado = { passo: 0, idClinica: null, idEspecialidade: null, idVinculo: null, data: null, hora: null };

async function iniciar(s) {
  eu = s;
  montarLayout(s);
  const raiz = $("#conteudo");
  raiz.replaceChildren(h("h1", {}, "Agendar consulta"), carregando("Carregando clínicas e horários..."));

  if (!s.idPaciente) {
    raiz.replaceChildren(
      h("h1", {}, "Agendar consulta"),
      avisoDeErro("Não encontramos seu cadastro de paciente. Saia e entre novamente."),
    );
    return;
  }

  try {
    [cat, disponibilidades, agendamentos] = await Promise.all([
      carregarCatalogo(),
      disponibilidadeService.listar(),
      agendamentoService.listar(),
    ]);
  } catch (err) {
    raiz.replaceChildren(h("h1", {}, "Agendar consulta"), avisoDeErro(err.message));
    return;
  }

  // Link vindo da tela de clínicas: ?clinica=ID
  const idInicial = Number(new URLSearchParams(location.search).get("clinica"));
  if (cat.clinicaPorId.has(idInicial)) {
    estado.idClinica = idInicial;
    estado.passo = 1;
  }
  render();
}

// ---------- Regras de disponibilidade ----------
function horariosLivres(idVinculo, data) {
  const janelas = disponibilidades.filter(
    (d) => d.idVinculo === idVinculo && d.data === data && d.status === "DISPONIVEL",
  );
  const ocupados = new Set(
    agendamentos
      .filter((a) => a.idVinculo === idVinculo && a.data === data && a.status !== "CANCELADO")
      .map((a) => a.hora),
  );
  const todos = new Set(janelas.flatMap((j) => gerarHorarios(j)));
  let livres = [...todos].filter((hh) => !ocupados.has(hh)).sort();
  if (data === hojeISO()) livres = livres.filter((hh) => hh > agoraHHMM());
  return livres;
}

function diasComHorarios(idVinculo) {
  const datas = [...new Set(disponibilidades.filter((d) => d.idVinculo === idVinculo).map((d) => d.data))]
    .filter((d) => d >= hojeISO())
    .sort();
  return datas
    .map((data) => ({ data, livres: horariosLivres(idVinculo, data).length }))
    .filter((d) => d.livres > 0);
}

// ---------- Navegação ----------
function escolher(campo, valor) {
  const i = ORDEM.indexOf(campo);
  ORDEM.slice(i + 1).forEach((c) => (estado[c] = null));
  estado[campo] = valor;
  estado.passo = i + 1;
  render();
}

function voltar() {
  estado.passo = Math.max(0, estado.passo - 1);
  render();
}

// ---------- Renderização ----------
function opcoes(itens, selecionado, aoEscolher, { classe = "opcoes", rotulo }) {
  return h(
    "div",
    { class: classe, role: "radiogroup", "aria-label": rotulo },
    itens.map((i) =>
      h(
        "button",
        {
          type: "button",
          class: "opcao",
          role: "radio",
          "aria-checked": String(i.id === selecionado),
          onclick: () => aoEscolher(i.id),
        },
        i.conteudo,
      ),
    ),
  );
}

function render() {
  const raiz = $("#conteudo");
  const passos = h(
    "ol",
    { class: "passos", "aria-label": "Etapas do agendamento" },
    ROTULOS.map((r, i) =>
      h("li", { "data-estado": i < estado.passo ? "feito" : i === estado.passo ? "atual" : "", title: r }),
    ),
  );
  const titulo = h(
    "h2",
    { id: "passo-titulo", class: "passo-titulo", tabindex: "-1" },
    `Passo ${estado.passo + 1} de ${ROTULOS.length}: ${tituloDoPasso()}`,
  );

  const acoes = h(
    "div",
    { class: "passo-acoes" },
    estado.passo > 0 ? h("button", { class: "btn btn--secundario", type: "button", onclick: voltar }, "Voltar") : null,
  );

  raiz.replaceChildren(h("h1", {}, "Agendar consulta"), passos, titulo, conteudoDoPasso(), acoes);
  $("#passo-titulo").focus({ preventScroll: false });
}

function tituloDoPasso() {
  return [
    "Escolha a clínica",
    "Escolha a especialidade",
    "Escolha o profissional",
    "Escolha o dia",
    "Escolha o horário",
    "Confirme seu agendamento",
  ][estado.passo];
}

function conteudoDoPasso() {
  switch (estado.passo) {
    case 0:
      return passoClinica();
    case 1:
      return passoEspecialidade();
    case 2:
      return passoProfissional();
    case 3:
      return passoDia();
    case 4:
      return passoHorario();
    default:
      return passoConfirmar();
  }
}

function passoClinica() {
  if (cat.clinicas.length === 0) return estadoVazio("Nenhuma clínica disponível no momento.");
  return opcoes(
    cat.clinicas.map((c) => ({ id: c.id, conteudo: [h("strong", {}, c.nome), h("span", {}, c.endereco)] })),
    estado.idClinica,
    (id) => escolher("idClinica", id),
    { rotulo: "Clínicas" },
  );
}

function passoEspecialidade() {
  const itens = cat.clinEsp
    .filter((x) => x.idClinica === estado.idClinica)
    .map((x) => cat.especialidadePorId.get(x.idEspecialidade))
    .filter(Boolean);
  if (itens.length === 0) return estadoVazio("Esta clínica ainda não tem especialidades cadastradas.");
  return opcoes(
    itens.map((e) => ({ id: e.id, conteudo: [h("strong", {}, e.nome), e.descricao ? h("span", {}, e.descricao) : null] })),
    estado.idEspecialidade,
    (id) => escolher("idEspecialidade", id),
    { rotulo: "Especialidades" },
  );
}

function passoProfissional() {
  const vinculos = cat.vinculos.filter((v) => {
    if (v.idClinica !== estado.idClinica) return false;
    const p = cat.profissionalPorId.get(v.idProfissional);
    return (
      p?.ativo &&
      cat.profEsp.some((x) => x.idProfissional === v.idProfissional && x.idEspecialidade === estado.idEspecialidade)
    );
  });
  if (vinculos.length === 0) {
    return estadoVazio("Nenhum profissional atende essa especialidade nesta clínica. Volte e escolha outra opção.");
  }
  return opcoes(
    vinculos.map((v) => {
      const p = cat.profissionalPorId.get(v.idProfissional);
      return { id: v.id, conteudo: [h("strong", {}, p.nome), h("span", {}, `${p.conselho} ${p.registro}/${p.uf}`)] };
    }),
    estado.idVinculo,
    (id) => escolher("idVinculo", id),
    { rotulo: "Profissionais" },
  );
}

function passoDia() {
  const dias = diasComHorarios(estado.idVinculo);
  if (dias.length === 0) {
    return estadoVazio("Este profissional não tem horários livres no momento. Volte e escolha outro profissional.");
  }
  return opcoes(
    dias.map((d) => ({
      id: d.data,
      conteudo: [
        h("strong", {}, formatarData(d.data)),
        h("span", {}, d.livres === 1 ? "1 horário livre" : `${d.livres} horários livres`),
      ],
    })),
    estado.data,
    (id) => escolher("data", id),
    { rotulo: "Dias disponíveis" },
  );
}

function passoHorario() {
  const livres = horariosLivres(estado.idVinculo, estado.data);
  if (livres.length === 0) return estadoVazio("Não há mais horários livres neste dia. Volte e escolha outro dia.");
  return opcoes(
    livres.map((hh) => ({ id: hh, conteudo: hh })),
    estado.hora,
    (id) => escolher("hora", id),
    { classe: "horarios", rotulo: `Horários em ${formatarData(estado.data)}` },
  );
}

function passoConfirmar() {
  const clinica = cat.clinicaPorId.get(estado.idClinica);
  const esp = cat.especialidadePorId.get(estado.idEspecialidade);
  const vinc = cat.vinculoPorId.get(estado.idVinculo);
  const prof = cat.profissionalPorId.get(vinc?.idProfissional);

  const obs = h("textarea", { id: "obs", rows: "3", maxlength: "500", placeholder: "Ex.: preciso de acompanhante, dor no joelho..." });
  const botao = h("button", { class: "btn btn--bloco", type: "button" }, "Confirmar agendamento");
  botao.addEventListener("click", () => enviar(botao, obs.value.trim()));

  return h(
    "div",
    { class: "card" },
    h(
      "dl",
      { class: "resumo" },
      h("dt", {}, "Clínica"), h("dd", {}, clinica?.nome),
      h("dt", {}, "Especialidade"), h("dd", {}, esp?.nome),
      h("dt", {}, "Profissional"), h("dd", {}, prof?.nome),
      h("dt", {}, "Dia"), h("dd", {}, formatarData(estado.data)),
      h("dt", {}, "Horário"), h("dd", {}, estado.hora),
    ),
    h("div", { class: "campo" }, h("label", { for: "obs" }, "Observação (opcional)"), obs),
    h("div", { style: "margin-top:var(--espaco-2)" }, botao),
  );
}

async function enviar(botao, observacao) {
  try {
    await comBotaoOcupado(botao, "Agendando...", () =>
      agendamentoService.criar({
        idPaciente: eu.idPaciente,
        idVinculo: estado.idVinculo,
        idEspecialidade: estado.idEspecialidade,
        data: estado.data,
        hora: estado.hora,
        observacao,
      }),
    );
    toast("Consulta agendada! Aguarde a confirmação.", "sucesso");
    setTimeout(() => (location.href = "agendamentos.html"), 1300);
  } catch (err) {
    if (err.status === 409) {
      // Alguém pegou o horário antes: recarrega e volta para a escolha do horário.
      agendamentos = await agendamentoService.listar().catch(() => agendamentos);
      estado.hora = null;
      estado.passo = 4;
      render();
      toast(err.message, "erro");
    } else {
      toast(err.message, "erro");
    }
  }
}

// Inicia só depois de todas as declarações do módulo (evita acessar let/const antes da inicialização).
const sessao = exigirLogin([PERFIS.PACIENTE]);
if (sessao) iniciar(sessao);

import { exigirLogin, PERFIS } from "../core/guard.js";
import { montarLayout, avisoDeErro } from "../ui/layout.js";
import { h, $, carregando, estadoVazio, toast, comBotaoOcupado } from "../core/dom.js";
import { carregarCatalogo } from "../ui/catalogo.js";
import { agendamentoService } from "../services/agendamentoService.js";
import { pacienteApi } from "../services/usuarioService.js";
import { toPaciente, STATUS_AGENDAMENTO } from "../mappers/index.js";
import { confirmar } from "../ui/dialogo.js";
import { formatarData, hojeISO, agoraHHMM } from "../core/datetime.js";

let eu, cat, pacientePorId;

const TITULO = {
  [PERFIS.PACIENTE]: "Meus agendamentos",
  [PERFIS.PROFISSIONAL]: "Minha agenda",
  [PERFIS.ADMIN]: "Agendamentos",
};

async function iniciar(s) {
  eu = s;
  montarLayout(s);
  await desenhar();
}

async function desenhar() {
  const raiz = $("#conteudo");
  const titulo = h("div", { class: "pagina-titulo" }, h("h1", {}, TITULO[eu.tipo] ?? "Agendamentos"),
    eu.tipo === PERFIS.PACIENTE ? h("a", { class: "btn", href: "agendamento.html" }, "Nova consulta") : null);
  raiz.replaceChildren(titulo, carregando("Carregando agendamentos..."));

  try {
    const precisaPacientes = eu.tipo !== PERFIS.PACIENTE;
    const [lista, catalogo, pacientes] = await Promise.all([
      agendamentoService.listar(),
      carregarCatalogo({ incluirInativos: true }),
      precisaPacientes ? pacienteApi.listar() : Promise.resolve([]),
    ]);
    cat = catalogo;
    pacientePorId = new Map(pacientes.map(toPaciente).map((p) => [p.id, p]));

    const meus = filtrarPorPerfil(lista);
    const agora = `${hojeISO()} ${agoraHHMM()}`;
    const ordenar = (a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`);
    const futuros = meus
      .filter((a) => `${a.data} ${a.hora}` >= agora && ["PENDENTE", "CONFIRMADO"].includes(a.status))
      .sort(ordenar);
    const historico = meus.filter((a) => !futuros.includes(a)).sort((a, b) => ordenar(b, a));

    // replaceChildren transforma null em texto "null": filtra os blocos opcionais.
    const blocos = [
      titulo,
      eu.tipo === PERFIS.PROFISSIONAL && !eu.idProfissional
        ? h("div", { class: "alerta alerta--aviso" }, "Seu usuário ainda não tem cadastro de profissional.")
        : null,
      h("h2", {}, "Próximas consultas"),
      futuros.length ? h("div", { class: "grade" }, futuros.map(cartao)) : estadoVazio("Nenhuma consulta marcada."),
      historico.length ? h("h2", { style: "margin-top:var(--espaco-4)" }, "Histórico") : null,
      historico.length ? h("div", { class: "grade" }, historico.map(cartao)) : null,
    ].filter(Boolean);
    raiz.replaceChildren(...blocos);
  } catch (err) {
    raiz.replaceChildren(titulo, avisoDeErro(err.message));
  }
}

function filtrarPorPerfil(lista) {
  if (eu.tipo === PERFIS.ADMIN) return lista;
  if (eu.tipo === PERFIS.PACIENTE) return lista.filter((a) => a.idPaciente === eu.idPaciente);
  const meusVinculos = new Set(cat.vinculos.filter((v) => v.idProfissional === eu.idProfissional).map((v) => v.id));
  return lista.filter((a) => meusVinculos.has(a.idVinculo));
}

function cartao(a) {
  const esp = a.especialidadeNome || cat.especialidadePorId.get(a.idEspecialidade)?.nome || "Consulta";
  const paciente = pacientePorId.get(a.idPaciente)?.usuario?.nome;
  const futuro = `${a.data} ${a.hora}` >= `${hojeISO()} ${agoraHHMM()}`;
  const aberto = ["PENDENTE", "CONFIRMADO"].includes(a.status);

  const acoes = [];
  const botao = (texto, classe, novoStatus, pergunta) => {
    const b = h("button", { class: `btn btn--pequeno ${classe}`, type: "button" }, texto);
    b.addEventListener("click", async () => {
      if (pergunta && !(await confirmar(pergunta, texto))) return;
      try {
        await comBotaoOcupado(b, "Salvando...", () => agendamentoService.alterarStatus(a.id, novoStatus));
        toast("Agendamento atualizado.", "sucesso");
        await desenhar();
      } catch (err) {
        toast(err.message, "erro");
      }
    });
    return b;
  };

  if (eu.tipo !== PERFIS.PACIENTE) {
    if (a.status === "PENDENTE") acoes.push(botao("Confirmar", "", "CONFIRMADO"));
    if (a.status === "CONFIRMADO") acoes.push(botao("Concluir", "", "CONCLUIDO"));
  }
  if (aberto && (futuro || eu.tipo !== PERFIS.PACIENTE)) {
    acoes.push(botao("Cancelar", "btn--perigo", "CANCELADO", "Deseja cancelar este agendamento?"));
  }

  return h(
    "article",
    { class: "card" },
    h("h3", {}, esp, " ", h("span", { class: `etiqueta etiqueta--${a.status}` }, STATUS_AGENDAMENTO[a.status] ?? a.status)),
    h("p", {}, h("strong", {}, `${formatarData(a.data)}, às ${a.hora}`)),
    h("p", { class: "card__meta" }, cat.rotuloVinculo(a.idVinculo)),
    eu.tipo !== PERFIS.PACIENTE && paciente ? h("p", { class: "card__meta" }, `Paciente: ${paciente}`) : null,
    a.observacao ? h("p", { class: "card__meta" }, `Obs.: ${a.observacao}`) : null,
    acoes.length ? h("div", { class: "card__acoes" }, acoes) : null,
  );
}

// Inicia só depois de todas as declarações do módulo (evita acessar let/const antes da inicialização).
const sessao = exigirLogin();
if (sessao) iniciar(sessao);

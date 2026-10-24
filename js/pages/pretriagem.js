// Pré-triagem: o paciente descreve o que sente, recebe uma orientação inicial e segue para o agendamento.
import { exigirLogin, PERFIS } from "../core/guard.js";
import { h, $, toast } from "../core/dom.js";
import { barraFluxo } from "../ui/fluxo.js";
import { montarNavInferior, removerNavInferior } from "../ui/navInferior.js";
import { orientar, MENSAGEM_URGENCIA, PADRAO_DA_AREA } from "../core/triagem.js";
import { especialidadeService } from "../services/especialidadeService.js";
import { registrarPwa } from "../pwa.js";

const LIMITE = 500;
const CHIPS = [
  ["febre", "Febre", "icons/ui/febre.png"],
  ["dor", "Dor", "icons/ui/dor.png"],
  ["inchaco", "Inchaço", "icons/ui/inchaco.png"],
  ["lesao", "Lesão", "icons/ui/lesao.svg"],
];
const ROTULO_AREA = { ORTOPEDIA: "Ortopedia", FISIOTERAPIA: "Fisioterapia" };
const ICONE_AREA = { ORTOPEDIA: "icons/ui/esp-ortopedia.png", FISIOTERAPIA: "icons/ui/esp-reabilitacao.png" };

const estado = { texto: "", rapidas: new Set(), etapa: "formulario" };
let barra;

function iniciar() {
  registrarPwa();
  barra = $("#barra");
  mostrarFormulario();
}

function voltar() {
  if (estado.etapa === "resultado") mostrarFormulario();
  else location.href = "home.html";
}

function trocarBarra() {
  barra.replaceChildren(barraFluxo("Pré-triagem", voltar));
}

// ---------- formulário ----------
function mostrarFormulario() {
  estado.etapa = "formulario";
  removerNavInferior();
  trocarBarra();

  const area = h("textarea", {
    id: "sintomas",
    maxlength: String(LIMITE),
    placeholder: "Descreva o que está sentindo...",
    "aria-label": "Descreva o que está sentindo",
    oninput: (e) => {
      estado.texto = e.target.value;
      atualizar();
    },
  });
  area.value = estado.texto;
  const contador = h("p", { class: "triagem__contador", id: "contador", "aria-live": "off" }, `${estado.texto.length}/${LIMITE}`);

  const chips = CHIPS.map(([chave, rotulo, icone]) =>
    h(
      "button",
      {
        type: "button",
        class: "chip",
        "data-chave": chave,
        "aria-pressed": String(estado.rapidas.has(chave)),
        onclick: (e) => {
          const b = e.currentTarget;
          estado.rapidas.has(chave) ? estado.rapidas.delete(chave) : estado.rapidas.add(chave);
          b.setAttribute("aria-pressed", String(estado.rapidas.has(chave)));
          atualizar();
        },
      },
      h("img", { src: icone, alt: "", width: "30", height: "30" }),
      rotulo,
    ),
  );
  const outro = h("button", { type: "button", class: "chip chip--largo", id: "outro", onclick: () => area.focus() }, "Outro motivo...");

  const continuar = h(
    "button",
    { class: "btn btn--seta", id: "continuar", type: "button", disabled: true, onclick: mostrarResultado },
    "Continuar",
    h("img", { src: "icons/ui/seta.svg", alt: "", width: "25", height: "25" }),
  );

  function atualizar() {
    contador.textContent = `${estado.texto.length}/${LIMITE}`;
    continuar.disabled = estado.texto.trim().length < 3 && estado.rapidas.size === 0;
  }

  $("#conteudo").className = "fluxo";
  $("#conteudo").replaceChildren(
    h("h1", { class: "fluxo__titulo", style: "margin-top:26px" }, "Vamos entender o que você precisa."),
    h("p", { class: "fluxo__sub" }, "Conte o que está acontecendo e indicaremos o melhor caminho para você."),
    h("div", { class: "triagem__area" }, area, contador),
    h("p", { class: "triagem__rapida-titulo" }, "Ou escolha uma opção rápida:"),
    h("div", { class: "triagem__chips" }, ...chips, outro),
    h("div", { class: "triagem__acao" }, continuar),
  );
  atualizar();
}

// ---------- resultado ----------
async function mostrarResultado() {
  estado.etapa = "resultado";
  trocarBarra();
  const { area, urgente } = orientar({ texto: estado.texto, rapidas: [...estado.rapidas] });

  // Liga a área sugerida à especialidade cadastrada na API (se existir) para pré-selecionar no agendamento.
  let esp = null;
  try {
    esp = (await especialidadeService.listar()).find((e) => PADRAO_DA_AREA[area].test(e.nome)) ?? null;
  } catch {
    /* sem rede: segue sem pré-seleção */
  }
  const nome = esp?.nome ?? ROTULO_AREA[area];

  const agendarHref = esp ? `agendamento.html?especialidade=${esp.id}` : "agendamento.html";
  $("#conteudo").className = "fluxo fluxo--sem-rodape";
  $("#conteudo").replaceChildren(
    h("img", { class: "resultado__ilustracao", src: "icons/ui/profissional-triagem.png", alt: "", width: "309", height: "309" }),
    h("div", { class: "faixa-ok", role: "status" }, h("img", { src: "icons/ui/ok.svg", alt: "", width: "20", height: "20" }), "Análise concluída!"),
    h("p", { class: "resultado__texto" }, "Com base nas informações que você contou, podemos ajudar você a encontrar um atendimento adequado."),
    h(
      "section",
      { class: "orientacao", "aria-label": "Orientação inicial" },
      h(
        "div",
        { class: "orientacao__topo" },
        h("span", { class: "orientacao__icone" }, h("img", { src: ICONE_AREA[area], alt: "", width: "40", height: "40" })),
        h("div", {}, h("p", { class: "orientacao__rotulo" }, "Orientação inicial"), h("p", { class: "orientacao__nome" }, nome)),
      ),
      h("p", { class: "orientacao__texto" }, "Esse atendimento pode ajudar a avaliar os sintomas que você informou."),
      urgente ? h("p", { class: "orientacao__urgente", role: "alert" }, MENSAGEM_URGENCIA) : null,
      h(
        "div",
        { class: "orientacao__acoes" },
        h("a", { class: "btn", id: "agendar", href: agendarHref }, "Agendar atendimento"),
        h("button", { class: "btn btn--contorno", type: "button", onclick: mostrarFormulario }, "Refazer triagem"),
      ),
    ),
    h(
      "p",
      { class: "aviso-medico" },
      h("img", { src: "icons/ui/aviso.png", alt: "", width: "30", height: "30" }),
      "Esta orientação não substitui uma avaliação de um profissional médico.",
    ),
  );
  montarNavInferior("inicio");
  window.scrollTo(0, 0);
}

const sessao = exigirLogin([PERFIS.PACIENTE]);
if (sessao) iniciar();

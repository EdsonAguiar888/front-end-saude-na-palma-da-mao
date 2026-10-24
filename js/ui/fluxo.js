// Peças compartilhadas pelas telas de fluxo do paciente (pré-triagem e agendamento).
import { h } from "../core/dom.js";

// Barra superior: seta de voltar, título da seção e logo.
// aoVoltar pode ser uma função ou um href (string).
export function barraFluxo(titulo, aoVoltar) {
  const seta = h("img", { src: "icons/ui/voltar.svg", alt: "", width: "15", height: "21" });
  const voltar =
    typeof aoVoltar === "string"
      ? h("a", { class: "fluxo-barra__voltar", href: aoVoltar, "aria-label": "Voltar" }, seta)
      : h("button", { class: "fluxo-barra__voltar", type: "button", "aria-label": "Voltar", onclick: aoVoltar }, seta);
  return h(
    "header",
    { class: "fluxo-barra" },
    voltar,
    h("p", { class: "fluxo-barra__titulo" }, titulo),
    h("img", { class: "fluxo-barra__logo", src: "icons/logo.svg", alt: "TriaOrto+", width: "32", height: "32" }),
  );
}

// Indicador "1 2 3 4 5": passo atual preenchido.
export function passos(atual, total = 5) {
  return h(
    "ol",
    { class: "passos5", "aria-label": `Passo ${atual + 1} de ${total}` },
    Array.from({ length: total }, (_, i) =>
      h(
        "li",
        { "data-estado": i === atual ? "atual" : i < atual ? "feito" : "", "aria-current": i === atual ? "step" : false },
        h("span", {}, String(i + 1)),
      ),
    ),
  );
}

// Campo de busca com lupa. Chama aoDigitar(texto) a cada tecla.
export function campoBusca(placeholder, aoDigitar) {
  const input = h("input", {
    type: "search",
    placeholder,
    "aria-label": placeholder.replace(/\.+$/, ""),
    autocomplete: "off",
    oninput: (e) => aoDigitar(e.target.value),
  });
  return h("div", { class: "busca" }, h("img", { src: "icons/ui/busca.svg", alt: "", width: "17", height: "17" }), input);
}

// Rodapé fixo com Voltar (contorno) e Continuar (cheio). Retorna { el, continuar }.
export function rodapeFluxo({ aoVoltar, aoContinuar, rotulo = "Continuar", habilitado = false }) {
  const continuar = h("button", { class: "btn", type: "button", onclick: aoContinuar, disabled: !habilitado }, rotulo);
  const el = h(
    "div",
    { class: "fluxo-rodape" },
    h("button", { class: "btn btn--contorno", type: "button", onclick: aoVoltar }, "Voltar"),
    continuar,
  );
  return { el, continuar };
}

export { normalizar } from "../core/triagem.js";

export const iniciais = (nome) =>
  String(nome ?? "")
    .replace(/^(dr|dra)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

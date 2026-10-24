// Barra de navegação inferior do paciente (Início, Agendamentos, Perfil), como no Figma.
import { h } from "../core/dom.js";

const ITENS = [
  { chave: "inicio", href: "home.html", rotulo: "Início", icone: "icons/ui/nav-inicio.png" },
  { chave: "agendamentos", href: "agendamentos.html", rotulo: "Agendamentos", icone: "icons/ui/nav-agendamentos.png" },
  { chave: "perfil", href: "perfil.html", rotulo: "Perfil", icone: "icons/ui/nav-perfil.svg" },
];

// O ícone é usado como máscara: a cor vem do CSS (verde na aba ativa, cinza nas demais).
export function montarNavInferior(ativa) {
  const nav = h(
    "nav",
    { class: "nav-inferior", "aria-label": "Principal" },
    ITENS.map((i) =>
      h(
        "a",
        { href: i.href, "aria-current": i.chave === ativa ? "page" : false },
        h("span", { class: "nav-inferior__icone", style: `--icone:url("${new URL(i.icone, document.baseURI).href}")`, "aria-hidden": "true" }),
        h("span", {}, i.rotulo),
      ),
    ),
  );
  document.body.classList.add("com-nav-inferior");
  document.body.append(nav);
  return nav;
}

// Remove a barra (telas do fluxo que usam Voltar/Continuar no lugar dela).
export function removerNavInferior() {
  document.querySelector(".nav-inferior")?.remove();
  document.body.classList.remove("com-nav-inferior");
}

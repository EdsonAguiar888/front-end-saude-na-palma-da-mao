// Helpers de DOM. Tudo que vem da API entra como texto (textContent),
// nunca como HTML, para evitar XSS.

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

// h("button", { class: "btn", onclick: fn, disabled: true }, "Texto", outroNo)
export function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

export function limpar(el) {
  el.replaceChildren();
  return el;
}

let timerToast;
export function toast(mensagem, tipo = "info") {
  let el = document.getElementById("toast");
  if (!el) {
    el = h("div", { id: "toast", role: "status", "aria-live": "polite" });
    document.body.append(el);
  }
  el.className = `toast toast--${tipo} toast--visivel`;
  el.textContent = mensagem;
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove("toast--visivel"), 5000);
}

// Desabilita o botão enquanto a ação roda (evita envio duplicado).
export async function comBotaoOcupado(botao, textoOcupado, acao) {
  const original = botao.textContent;
  botao.disabled = true;
  botao.textContent = textoOcupado;
  try {
    return await acao();
  } finally {
    botao.disabled = false;
    botao.textContent = original;
  }
}

export function estadoVazio(texto) {
  return h("p", { class: "vazio" }, texto);
}

export function carregando(texto = "Carregando...") {
  return h("p", { class: "carregando", role: "status" }, texto);
}

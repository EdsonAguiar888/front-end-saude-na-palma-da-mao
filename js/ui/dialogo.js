import { h } from "../core/dom.js";

// Confirmação acessível com <dialog> (no lugar de window.confirm).
export function confirmar(mensagem, textoOk = "Confirmar") {
  return new Promise((resolve) => {
    const fechar = (valor) => {
      if (dlg.open) dlg.close();
      dlg.remove();
      resolve(valor);
    };
    const dlg = h(
      "dialog",
      { "aria-labelledby": "dlg-msg" },
      h(
        "div",
        { class: "dialogo__corpo" },
        h("p", { id: "dlg-msg" }, mensagem),
        h(
          "div",
          { class: "card__acoes" },
          h("button", { class: "btn btn--perigo", type: "button", onclick: () => fechar(true) }, textoOk),
          h("button", { class: "btn btn--secundario", type: "button", onclick: () => fechar(false) }, "Voltar"),
        ),
      ),
    );
    dlg.addEventListener("cancel", () => fechar(false));
    document.body.append(dlg);
    dlg.showModal();
  });
}

import { authService } from "../services/authService.js";
import { sessao } from "../core/session.js";
import { paginaInicial } from "../core/guard.js";
import { $, comBotaoOcupado, toast } from "../core/dom.js";
import { registrarPwa } from "../pwa.js";

registrarPwa();

const jaLogado = sessao.get();
if (jaLogado) {
  location.replace(paginaInicial(jaLogado.tipo));
} else {
  iniciar();
}

function iniciar() {
  const form = $("#form-login");
  const erro = $("#erro");
  const aviso = $("#aviso-lento");

  window.addEventListener("api:lenta", () => (aviso.hidden = false));
  window.addEventListener("api:ociosa", () => (aviso.hidden = true));

  // Ainda não existem no back-end: avisamos em vez de fingir que funcionam.
  $("#esqueci").addEventListener("click", (e) => {
    e.preventDefault();
    toast("Recuperação de senha ainda não está disponível. Procure o atendimento.");
  });
  $("#btn-google").addEventListener("click", () => toast("Entrar com o Google ainda não está disponível."));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erro.textContent = "";
    if (!form.checkValidity()) {
      erro.textContent = "Informe seu e-mail ou CPF e a senha.";
      return;
    }
    const { identificador, senha } = Object.fromEntries(new FormData(form));
    try {
      const dados = await comBotaoOcupado($("button[type=submit]", form), "Entrando...", () =>
        authService.login(identificador, senha, { lembrar: $("#lembrar").checked }),
      );
      location.href = paginaInicial(dados.tipo);
    } catch (err) {
      erro.textContent = err.message;
    }
  });
}

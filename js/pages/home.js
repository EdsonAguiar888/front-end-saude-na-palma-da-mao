// Início do paciente: saudação, atalhos e barra de navegação inferior.
import { exigirLogin, PERFIS } from "../core/guard.js";
import { $ } from "../core/dom.js";
import { montarNavInferior } from "../ui/navInferior.js";
import { registrarPwa } from "../pwa.js";

function iniciar(s) {
  registrarPwa();
  const primeiroNome = String(s.nome ?? "").trim().split(/\s+/)[0];
  $("#saudacao").textContent = primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!";
  document.title = "Início | TriaOrto+";

  montarNavInferior("inicio");
}

const sessao = exigirLogin([PERFIS.PACIENTE]);
if (sessao) iniciar(sessao);

// Início do paciente: saudação, atalhos e barra de navegação inferior.
import { exigirLogin, PERFIS } from "../core/guard.js";
import { $, toast } from "../core/dom.js";
import { montarNavInferior } from "../ui/navInferior.js";
import { registrarPwa } from "../pwa.js";

function iniciar(s) {
  registrarPwa();
  const primeiroNome = String(s.nome ?? "").trim().split(/\s+/)[0];
  $("#saudacao").textContent = primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!";
  document.title = "Início | OrtoFisio+";

  // Ainda não existe no back-end: avisamos em vez de abrir uma tela vazia.
  $("#acao-triagem").addEventListener("click", (e) => {
    e.preventDefault();
    toast("A pré-triagem ainda não está disponível. Em breve!");
  });

  montarNavInferior("inicio");
}

const sessao = exigirLogin([PERFIS.PACIENTE]);
if (sessao) iniciar(sessao);

// Perfil do paciente: mostra os dados da sessão e permite sair.
import { exigirLogin, PERFIS } from "../core/guard.js";
import { authService } from "../services/authService.js";
import { $ } from "../core/dom.js";
import { montarNavInferior } from "../ui/navInferior.js";
import { registrarPwa } from "../pwa.js";

function iniciar(s) {
  registrarPwa();
  $("#p-nome").textContent = s.nome ?? "";
  $("#p-email").textContent = s.email ?? "";
  $("#btn-sair").addEventListener("click", () => authService.logout());
  montarNavInferior("perfil");
}

const sessao = exigirLogin([PERFIS.PACIENTE]);
if (sessao) iniciar(sessao);

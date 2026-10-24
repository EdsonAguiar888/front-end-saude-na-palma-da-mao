// Telas públicas sem lógica própria (início).
import { sessao } from "../core/session.js";
import { paginaInicial } from "../core/guard.js";
import { registrarPwa } from "../pwa.js";

registrarPwa();
const s = sessao.get();
if (s) location.replace(paginaInicial(s.tipo)); // quem já entrou vai direto ao app

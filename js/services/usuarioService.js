import { crud } from "../core/http.js";

// Uso interno de authService e profissionalService.
// Retorna os dados crus da API; quem precisar de mapeamento usa mappers/toUsuario.
export const usuarioApi = crud("/usuarios");
export const pacienteApi = crud("/pacientes");

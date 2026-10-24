import { crud } from "../core/http.js";
import { toEspecialidade } from "../mappers/index.js";

const especialidades = crud("/especialidades");

export const especialidadeService = {
  async listar({ apenasAtivas = true } = {}) {
    const lista = (await especialidades.listar()).map(toEspecialidade);
    return apenasAtivas ? lista.filter((e) => e.ativo) : lista;
  },
};

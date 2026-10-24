import { crud } from "../core/http.js";
import { toClinica } from "../mappers/index.js";

const clinicas = crud("/clinicas");
const clinicaEspecialidades = crud("/clinica-especialidade");

export const clinicaService = {
  async listar({ apenasAtivas = true } = {}) {
    const lista = (await clinicas.listar()).map(toClinica);
    return apenasAtivas ? lista.filter((c) => c.ativo) : lista;
  },

  // [{ idClinica, idEspecialidade }]
  async listarEspecialidades() {
    const lista = await clinicaEspecialidades.listar();
    return lista.map((x) => ({
      idClinica: Number(x.id_clinica),
      idEspecialidade: Number(x.id_especialidade),
    }));
  },
};

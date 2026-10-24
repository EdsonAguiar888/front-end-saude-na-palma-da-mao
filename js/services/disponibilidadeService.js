import { crud } from "../core/http.js";
import { toDisponibilidade } from "../mappers/index.js";

const disponibilidades = crud("/disponibilidades");

export const disponibilidadeService = {
  async listar() {
    return (await disponibilidades.listar()).map(toDisponibilidade);
  },

  async criar({ idVinculo, data, horaInicio, horaFim, duracaoMinutos }) {
    return disponibilidades.criar({
      id_profissional_clinica: Number(idVinculo),
      data_atendimento: data,
      hora_inicio: `${horaInicio}:00`,
      hora_fim: `${horaFim}:00`,
      duracao_minutos: Number(duracaoMinutos),
      status: "DISPONIVEL",
    });
  },

  async alterarStatus(id, status) {
    await disponibilidades.atualizar(id, { status });
  },

  async remover(id) {
    await disponibilidades.remover(id);
  },
};

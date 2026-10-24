import { crud } from "../core/http.js";
import { toProfissional, toVinculo } from "../mappers/index.js";
import { usuarioApi } from "./usuarioService.js";

const profissionais = crud("/profissionais");
const vinculos = crud("/profissional-clinica");
const profEspecialidades = crud("/profissional-especialidade");

export const profissionalService = {
  async listar() {
    return (await profissionais.listar()).map(toProfissional);
  },

  async alterarAtivo(id, ativo) {
    await profissionais.atualizar(id, { ativo });
  },

  async listarVinculos({ apenasAtivos = true } = {}) {
    const lista = (await vinculos.listar()).map(toVinculo);
    return apenasAtivos ? lista.filter((v) => v.ativo) : lista;
  },

  // [{ idProfissional, idEspecialidade }]
  async listarEspecialidades() {
    const lista = await profEspecialidades.listar();
    return lista.map((x) => ({
      idProfissional: Number(x.id_profissional),
      idEspecialidade: Number(x.id_especialidade),
    }));
  },

  // Cadastro em 4 etapas (o back-end não tem transação):
  // usuário -> profissional -> vínculo com a clínica -> especialidades.
  // Se alguma etapa falhar, desfaz o que já foi criado.
  async cadastrarCompleto({ usuario, profissional, idClinica, idsEspecialidades }) {
    const u = await usuarioApi.criar({
      nome: usuario.nome,
      email: usuario.email,
      senha_hash: usuario.senha, // PROVISÓRIO (ver authService)
      telefone: usuario.telefone,
      tipo_usuario: "PROFISSIONAL",
    });

    let p = null;
    try {
      p = await profissionais.criar({
        id_usuario: Number(u.id_usuario),
        cpf: profissional.cpf,
        conselho: profissional.conselho,
        registro_profissional: profissional.registro,
        uf_registro: profissional.uf,
        ativo: true,
      });

      await vinculos.criar({
        id_profissional: Number(p.id_profissional),
        id_clinica: Number(idClinica),
        ativo: true,
      });

      for (const idEsp of idsEspecialidades) {
        await profEspecialidades.criar({
          id_profissional: Number(p.id_profissional),
          id_especialidade: Number(idEsp),
        });
      }
    } catch (erro) {
      // Apaga de trás para frente. Falhas aqui são ignoradas para preservar o erro original.
      if (p) {
        await profissionais.remover(p.id_profissional).catch(() => {});
      }
      await usuarioApi.remover(u.id_usuario).catch(() => {});
      throw erro;
    }
  },
};

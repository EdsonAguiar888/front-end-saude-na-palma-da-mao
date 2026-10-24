// =====================================================================
//  AUTENTICAÇÃO PROVISÓRIA
//
//  O back-end ainda não tem POST /auth/login nem JWT. Enquanto isso, o
//  login baixa a lista de usuários e compara e-mail e senha no navegador.
//
//  Consequências (aceitas só para o MVP/demonstração):
//   - a API entrega senha_hash de TODOS os usuários a qualquer cliente;
//   - a "senha" é gravada como foi digitada, sem hash;
//   - qualquer pessoa pode se passar por outro usuário.
//
//  Quando o back-end tiver login real, só ESTE arquivo muda:
//    login()  -> POST /auth/login, guardar o token em sessao e enviar em http()
//    registrarPaciente() -> não enviar mais a senha em texto puro
//  As telas continuam iguais.
// =====================================================================
import { http, ApiError } from "../core/http.js";
import { sessao } from "../core/session.js";
import { usuarioApi, pacienteApi } from "./usuarioService.js";

const normalizar = (s) => String(s ?? "").trim().toLowerCase();
const apenasDigitos = (s) => String(s ?? "").replace(/\D/g, "");

export const authService = {
  // "identificador" pode ser e-mail ou CPF (com ou sem pontuação). CPF só existe para pacientes.
  async login(identificador, senha, { lembrar = true } = {}) {
    const entrada = String(identificador ?? "").trim();
    const porEmail = entrada.includes("@");
    const usuarios = await usuarioApi.listar();
    let pacientes = null;
    let u;

    if (porEmail) {
      u = usuarios.find((x) => normalizar(x.email) === normalizar(entrada));
    } else {
      const cpf = apenasDigitos(entrada);
      pacientes = await pacienteApi.listar();
      const p = cpf.length === 11 ? pacientes.find((x) => apenasDigitos(x.cpf) === cpf) : null;
      u = p && usuarios.find((x) => Number(x.id_usuario) === Number(p.id_usuario));
    }

    if (!u || u.senha_hash !== senha) throw new ApiError("E-mail, CPF ou senha incorretos.", 401);
    if (u.ativo === false) throw new ApiError("Este usuário está inativo.", 403);

    const dados = {
      idUsuario: Number(u.id_usuario),
      nome: u.nome,
      email: u.email,
      tipo: u.tipo_usuario,
    };

    if (u.tipo_usuario === "PACIENTE") {
      pacientes ??= await pacienteApi.listar();
      const p = pacientes.find((x) => Number(x.id_usuario) === dados.idUsuario);
      if (!p) throw new ApiError("Cadastro de paciente incompleto. Procure o atendimento.", 403);
      dados.idPaciente = Number(p.id_paciente);
    }

    if (u.tipo_usuario === "PROFISSIONAL") {
      const profissionais = await http("/profissionais");
      const p = profissionais.find((x) => Number(x.id_usuario) === dados.idUsuario);
      if (p) dados.idProfissional = Number(p.id_profissional);
    }

    sessao.set(dados, { lembrar });
    return dados;
  },

  async registrarPaciente({ nome, email, senha, telefone, cpf, nascimento, sexo }) {
    const usuario = await usuarioApi.criar({
      nome,
      email,
      senha_hash: senha, // PROVISÓRIO: o back-end grava exatamente o que recebe
      telefone,
      tipo_usuario: "PACIENTE",
    });

    try {
      await pacienteApi.criar({
        id_usuario: Number(usuario.id_usuario),
        cpf,
        data_nascimento: nascimento,
        sexo: sexo || null,
      });
    } catch (erro) {
      // Sem transação no servidor: desfaz o usuário para não deixar cadastro pela metade.
      await usuarioApi.remover(usuario.id_usuario).catch(() => {});
      throw erro;
    }
  },

  logout() {
    sessao.limpar();
    location.href = "index.html";
  },

  atual: () => sessao.get(),
};

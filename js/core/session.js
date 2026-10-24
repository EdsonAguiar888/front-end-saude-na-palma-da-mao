import { SESSION_KEY } from "../config.js";

// Sessão guardada no navegador. Nunca armazena a senha.
// Formato: { idUsuario, nome, email, tipo, idPaciente?, idProfissional? }
// "lembrar" = true  -> localStorage (continua conectado ao reabrir o navegador)
// "lembrar" = false -> sessionStorage (vale só até fechar a aba)
const ler = (storage) => {
  try {
    return JSON.parse(storage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
};

export const sessao = {
  get() {
    return ler(sessionStorage) ?? ler(localStorage);
  },
  set(dados, { lembrar = true } = {}) {
    this.limpar();
    try {
      (lembrar ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(dados));
    } catch {
      /* armazenamento indisponível: sessão vale só até recarregar */
    }
  },
  limpar() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        storage.removeItem(SESSION_KEY);
      } catch {
        /* ignora */
      }
    }
  },
};

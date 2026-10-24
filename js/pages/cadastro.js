// Criar conta de paciente em 2 etapas:
//   1) dados pessoais (nome, CPF, nascimento)   2) contato e acesso (telefone, e-mail, senha)
import { authService } from "../services/authService.js";
import { $, $$, comBotaoOcupado, toast } from "../core/dom.js";
import { aplicarMascara, formatarCPF, formatarTelefone, apenasDigitos, validarCampoCPF } from "../ui/mascaras.js";
import { hojeISO } from "../core/datetime.js";
import { registrarPwa } from "../pwa.js";

registrarPwa();

const TOTAL_ETAPAS = 2;
let etapa = 1;

const form = $("#form-cadastro");
const erro = $("#erro");
const aviso = $("#aviso-lento");
const botao = $("#btn-continuar");
const pilula = $("#pilula");

window.addEventListener("api:lenta", () => (aviso.hidden = false));
window.addEventListener("api:ociosa", () => (aviso.hidden = true));

aplicarMascara($("#cpf"), formatarCPF);
aplicarMascara($("#telefone"), formatarTelefone);
validarCampoCPF($("#cpf"));
$("#nascimento").max = hojeISO();

const senha = $("#senha");
const senha2 = $("#senha2");
const conferirSenhas = () =>
  senha2.setCustomValidity(senha.value === senha2.value ? "" : "As senhas não são iguais.");

const secaoAtual = () => $(`.etapa[data-etapa="${etapa}"]`);
const etapaValida = () => $$("input, select", secaoAtual()).every((c) => c.checkValidity());

function mostrarEtapa({ focar = true } = {}) {
  $$(".etapa").forEach((s) => (s.hidden = Number(s.dataset.etapa) !== etapa));
  pilula.textContent = `Etapa ${etapa} de ${TOTAL_ETAPAS}`;
  botao.textContent = etapa < TOTAL_ETAPAS ? "Continuar" : "Criar conta";
  erro.textContent = "";
  conferirSenhas();
  botao.disabled = !etapaValida(); // fica cinza até a etapa estar completa, como no design
  if (focar) $("input, select", secaoAtual())?.focus(); // só ao trocar de etapa (evita abrir o teclado ao entrar)
}

form.addEventListener("input", () => {
  conferirSenhas();
  botao.disabled = !etapaValida();
});

$("#btn-voltar").addEventListener("click", () => {
  if (etapa > 1) {
    etapa--;
    mostrarEtapa();
  } else {
    location.href = "index.html";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!etapaValida()) return;

  if (etapa < TOTAL_ETAPAS) {
    etapa++;
    mostrarEtapa();
    return;
  }

  const d = Object.fromEntries(new FormData(form));
  try {
    await comBotaoOcupado(botao, "Criando conta...", () =>
      authService.registrarPaciente({
        nome: d.nome.trim(),
        email: d.email.trim(),
        senha: d.senha,
        telefone: apenasDigitos(d.telefone),
        cpf: d.cpf,
        nascimento: d.nascimento,
        sexo: "", // não coletado no design; a API aceita vazio
      }),
    );
    toast("Conta criada! Faça login para continuar.", "sucesso");
    setTimeout(() => (location.href = "login.html"), 1200);
  } catch (err) {
    // E-mail ou CPF repetidos chegam como erro do banco (violação de unicidade).
    erro.textContent = /unique|duplic|already|existe/i.test(err.message)
      ? "Já existe um cadastro com este e-mail ou CPF."
      : err.message;
  }
});

mostrarEtapa({ focar: false });

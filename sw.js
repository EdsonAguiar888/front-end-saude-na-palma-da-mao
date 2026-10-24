// Service worker do PWA.
// - App shell (HTML/CSS/JS): pré-cacheado; páginas usam rede primeiro e caem para o cache offline.
// - API (outra origem): NUNCA é interceptada nem cacheada, pois traz dados de saúde e de usuários.
// Ao publicar uma nova versão, aumente CACHE_VERSION para limpar os caches antigos.
const CACHE_VERSION = "v6";
const CACHE = `spm-${CACHE_VERSION}`;

const SHELL = [
  "./",
  "index.html",
  "home.html",
  "perfil.html",
  "pretriagem.html",
  "login.html",
  "cadastro.html",
  "clinicas.html",
  "profissionais.html",
  "disponibilidades.html",
  "agendamento.html",
  "agendamentos.html",
  "offline.html",
  "manifest.json",
  "css/base.css",
  "css/components.css",
  "css/fluxo.css",
  "icons/icon.svg",
  "icons/logo.svg",
  "icons/ilustracao.svg",
  "icons/decoracao-topo.svg",
  "icons/wordmark.svg",
  "icons/wordmark-escuro.svg",
  "icons/ui/agendar.svg",
  "icons/ui/aviso.png",
  "icons/ui/busca.svg",
  "icons/ui/cadeado.svg",
  "icons/ui/consultar.png",
  "icons/ui/dor.png",
  "icons/ui/esp-ortopedia.png",
  "icons/ui/esp-prevencao.png",
  "icons/ui/esp-reabilitacao.png",
  "icons/ui/febre.png",
  "icons/ui/google.png",
  "icons/ui/inchaco.png",
  "icons/ui/lesao.svg",
  "icons/ui/mao-coracao.png",
  "icons/ui/nav-agendamentos.png",
  "icons/ui/nav-inicio.png",
  "icons/ui/nav-perfil.svg",
  "icons/ui/ok.svg",
  "icons/ui/profissional-triagem.png",
  "icons/ui/seta.svg",
  "icons/ui/sucesso.png",
  "icons/ui/triagem.png",
  "icons/ui/usuario.png",
  "icons/ui/voltar.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/config.js",
  "js/pwa.js",
  "js/ui/catalogo.js",
  "js/ui/dialogo.js",
  "js/ui/fluxo.js",
  "js/ui/layout.js",
  "js/ui/mascaras.js",
  "js/ui/navInferior.js",
  "js/services/agendamentoService.js",
  "js/services/authService.js",
  "js/services/clinicaService.js",
  "js/services/disponibilidadeService.js",
  "js/services/especialidadeService.js",
  "js/services/profissionalService.js",
  "js/services/usuarioService.js",
  "js/mappers/index.js",
  "js/core/datetime.js",
  "js/core/dom.js",
  "js/core/guard.js",
  "js/core/http.js",
  "js/core/session.js",
  "js/core/triagem.js",
  "js/pages/agendamento.js",
  "js/pages/agendamentos.js",
  "js/pages/cadastro.js",
  "js/pages/clinicas.js",
  "js/pages/disponibilidades.js",
  "js/pages/home.js",
  "js/pages/login.js",
  "js/pages/perfil.js",
  "js/pages/pretriagem.js",
  "js/pages/profissionais.js",
  "js/pages/publica.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k.startsWith("spm-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // API e outros domínios: direto na rede

  // Navegação entre páginas: rede primeiro, cache e página offline como reserva.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("offline.html"))),
    );
    return;
  }

  // Arquivos estáticos: cache primeiro, atualizando em segundo plano.
  event.respondWith(
    caches.match(req).then((emCache) => {
      const rede = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return res;
        })
        .catch(() => emCache);
      return emCache || rede;
    }),
  );
});

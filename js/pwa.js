// Registra o service worker (funciona em HTTPS ou localhost).
let registrado = false;

export function registrarPwa() {
  if (registrado || !("serviceWorker" in navigator)) return;
  registrado = true;
  const registrar = () => navigator.serviceWorker.register("sw.js").catch(() => {});
  if (document.readyState === "complete") registrar();
  else window.addEventListener("load", registrar, { once: true });
}

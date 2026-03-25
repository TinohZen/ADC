// src/lib/apiFetch.ts

export async function apiFetch(url: string, options: RequestInit = {}) {
  // 1. On récupère le token stocké lors de la connexion
  const token = localStorage.getItem("adc_token");

  // 2. On prépare les en-têtes (Headers)
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  // 3. Si on a un token, on l'attache à la requête
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // 4. On lance la vraie requête fetch
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 5. SÉCURITÉ : Si le token est expiré ou invalide (401 ou 403)
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("adc_user");
    localStorage.removeItem("adc_token");
    window.location.href = "/login"; // On force le retour à la page de connexion
    throw new Error("Session expirée, veuillez vous reconnecter.");
  }

  return response;
}

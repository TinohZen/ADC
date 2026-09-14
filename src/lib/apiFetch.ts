const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes de validité

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("adc_token");
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isGet = !options.method || options.method.toUpperCase() === "GET";

  // Invalidation du cache lors des modifications (POST, PUT, DELETE)
  if (!isGet) {
    cache.clear();
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("adc_user");
    localStorage.removeItem("adc_token");
    window.location.href = "/login";
    throw new Error("Session expirée, veuillez vous reconnecter.");
  }

  return response;
}

export async function cachedApiFetch<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  const now = Date.now();

  // Si en cache, on retourne immédiatement
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const res = await apiFetch(url);
  const data = await res.json();
  cache.set(url, { data, timestamp: now });
  return data;
}
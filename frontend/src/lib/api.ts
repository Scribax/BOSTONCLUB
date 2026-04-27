export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("boston_club_token");
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("boston_club_token", token);
  }
};

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("boston_club_token");
    window.location.href = "/";
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Abort after 10 seconds to avoid infinite "Rendering..."
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
      // Bypass Service Worker cache for API calls
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (response.status === 401 || response.status === 403) {
      const data = await response.json().catch(() => ({}));
      
      if (data.message === "ACCOUNT_BLOCKED") {
        if (typeof window !== "undefined") {
          localStorage.removeItem("boston_club_token");
          window.location.href = "/blocked";
        }
        throw new Error("Cuenta bloqueada");
      }

      if (data.isEmailVerified === false) {
         throw new Error(JSON.stringify({ type: "UNVERIFIED_EMAIL", token: data.token || "" }));
      }

      logout();
      throw new Error(data.message || "No autorizado");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error en la petición");
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeout);
    
    // Error silencioso en producción - el componente manejará el estado de error

    if (err.name === "AbortError") {
      throw new Error("El servidor tardó demasiado. Intenta de nuevo.");
    }
    throw err;
  }
};

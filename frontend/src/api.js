const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("circuit_token");
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no JSON body
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),

  listExercises: () => request("/exercises"),
  createExercise: (formData) => request("/exercises", { method: "POST", body: formData, isForm: true }),
  updateExercise: (id, formData) => request(`/exercises/${id}`, { method: "PUT", body: formData, isForm: true }),
  deleteExercise: (id) => request(`/exercises/${id}`, { method: "DELETE" }),

  recordLog: (payload) => request("/logs", { method: "POST", body: payload }),
  getStats: () => request("/logs/stats"),
};

export function imageSrc(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const base = API_URL.replace(/\/api\/?$/, "");
  return `${base}${path}`;
}

export { getToken };
export const setToken = (t) => localStorage.setItem("circuit_token", t);
export const clearToken = () => localStorage.removeItem("circuit_token");

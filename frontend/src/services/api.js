import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const method = (error.config?.method || "get").toLowerCase();
    const backendMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (typeof error.response?.data === "string" ? error.response.data : "");

    if (
      status === 401 ||
      (status === 403 && method === "get") ||
      (status === 403 && !localStorage.getItem("user"))
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    let cleanMessage = backendMsg;
    if (status === 403) {
      cleanMessage =
        "Access Denied: Only ADMIN has permission to perform this action.";
    } else if (!cleanMessage) {
      if (!error.response) {
        cleanMessage =
          "Backend server is not reachable.";
      } else {
        cleanMessage = `Request failed (${status})`;
      }
    }

    error.message = cleanMessage;
    if (!error.response) {
      error.response = { data: { message: cleanMessage } };
    } else if (
      !error.response.data ||
      typeof error.response.data !== "object"
    ) {
      error.response.data = { message: cleanMessage };
    } else {
      error.response.data.message = cleanMessage;
    }

    return Promise.reject(error);
  }
);

export default api;

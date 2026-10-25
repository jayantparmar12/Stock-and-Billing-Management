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
    const message = (error.response?.data?.message || "").toLowerCase();

    const isUnauthenticated =
      status === 401 ||
      (status === 403 && !localStorage.getItem("user")) ||
      message.includes("user not found") ||
      message.includes("not authenticated") ||
      message.includes("jwt");

    if (isUnauthenticated && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


export default api;
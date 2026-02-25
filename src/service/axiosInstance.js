import axios from "axios";
import { base_URL } from "../config/Config";

// Main API instance
const axiosApi = axios.create({
  baseURL: base_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Refresh-only instance (no interceptors)
const refreshAxios = axios.create({
  baseURL: base_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", 
  },
});

/* ================= REQUEST ================= */
axiosApi.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem("auth"));

    if (auth?.access) {
      config.headers.Authorization = `Bearer ${auth.access}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE ================= */
let isRefreshing = false;
let failedQueue = [];

// ======================================= Redirect login page if another device logged in =======================================\\
const shouldForceLogout = (payload) => {
  const detail = payload?.detail;
  return (
    typeof detail === "string" &&
    /logged in from another device|please login again/i.test(detail)
  );
};

const redirectToLogin = () => {
  localStorage.removeItem("auth");
  window.location.href = "/login";
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

axiosApi.interceptors.response.use(
  (response) => {
    if (shouldForceLogout(response?.data)) {
      redirectToLogin();
      return Promise.reject(new Error(response.data.detail));
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (shouldForceLogout(error?.response?.data)) {
      redirectToLogin();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const auth = JSON.parse(localStorage.getItem("auth"));

      if (!auth?.refresh) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosApi(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await refreshAxios.post("api/token/refresh/", {
          refresh: auth.refresh,
        });

        const newAccess = res.data.access;

        localStorage.setItem(
          "auth",
          JSON.stringify({
            access: newAccess,
            refresh: auth.refresh,
          })
        );

        processQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axiosApi(originalRequest);
      } catch (err) {
        processQueue(err, null);
        redirectToLogin();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosApi;

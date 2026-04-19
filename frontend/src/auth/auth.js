const AUTH_STORAGE_KEY = "academic-erp-auth";

export const getDashboardPathForRole = (role) => {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "faculty":
      return "/faculty/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/login";
  }
};

export const getStoredAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return storedAuth ? JSON.parse(storedAuth) : null;
  } catch (error) {
    console.error("Failed to read auth data.", error);
    return null;
  }
};

export const getStoredRole = () => getStoredAuth()?.role ?? null;

export const isAuthenticated = () => Boolean(getStoredRole());

export const saveAuth = (authData) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
};

export const getStoredToken = () => getStoredAuth()?.accessToken ?? null;

export const clearAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

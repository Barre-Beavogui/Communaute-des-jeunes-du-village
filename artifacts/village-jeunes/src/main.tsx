import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

import App from "./App";
import { ErrorBoundary } from "@/components/error-boundary";

import "./index.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
setBaseUrl(apiBaseUrl || null);
setAuthTokenGetter(() => {
  const isAdminPage = /\/admin(?:\/|$)/.test(window.location.pathname);
  return sessionStorage.getItem(
    isAdminPage ? "zoboroma_admin_token" : "zoboroma_member_token",
  );
});

createRoot(document.getElementById("root")!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  let isRefreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (isRefreshing) return;
    isRefreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js?v=3", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch((error) => {
        console.warn("Installation hors-ligne indisponible", error);
      });
  });
}

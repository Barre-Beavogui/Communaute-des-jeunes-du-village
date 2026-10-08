import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { AuthKitProvider } from "@workos-inc/authkit-react";

import App from "./App";
import { ErrorBoundary } from "@/components/error-boundary";

import "./index.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const workosClientId =
  import.meta.env.VITE_WORKOS_CLIENT_ID?.trim() ||
  "client_01M4DPNE5HCJZV57ZAKTQH79WR";
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
  <AuthKitProvider
    clientId={workosClientId}
    redirectUri={`${window.location.origin}/connexion-membre`}
  >
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </AuthKitProvider>,
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

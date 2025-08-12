import React, { useEffect, useState } from "react";
import App from "./App";
import { ThemeProvider } from "./ThemeContext";
import AccountContainer from "./account/Account.container";

/**
 * Minimalny router oparty o hash (#/account) – bez zależności.
 * Nie zmienia istniejącego App.jsx. Utrzymuje wsteczną kompatybilność.
 */
export default function Root() {
  const getRoute = () =>
    (typeof window !== "undefined" && window.location.hash.startsWith("#/account"))
      ? "account" : "app";
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.title = route === "account" ? "Stackure – Profil" : "Stackure 3D Load Planner";
  }, [route]);

  if (route === "account") {
    return (
      <ThemeProvider>
        <div style={{ padding: 12 }}>
          <AccountContainer />
        </div>
      </ThemeProvider>
    );
  }
  return <App />;
}

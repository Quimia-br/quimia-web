import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { initializeAccessibility } from "./lib/accessibility";
import { initializeTheme } from "./lib/theme-bootstrap";

initializeAccessibility();
initializeTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

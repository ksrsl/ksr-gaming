import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import KSRGaming from "./KSRGaming";

const root = document.getElementById("root");

if (!root) {
  throw new Error("KSR Gaming root element is missing.");
}

createRoot(root).render(
  <StrictMode>
    <KSRGaming />
  </StrictMode>,
);

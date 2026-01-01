import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./firebase";

import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css"; // Ensure index came before default styles if any

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </BrowserRouter>
);

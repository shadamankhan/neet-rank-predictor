// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // ensures websocket binds properly
    port: 5173,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173
    },

    // ⭐ ONLY proxy /api — do NOT proxy /admin (frontend route)
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
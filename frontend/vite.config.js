import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiTarget =
  process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // pendant npm run dev, tout appel a /api/... est transmis a Laravel
      "/api": { target: apiTarget },
      // les photos des plats vivent dans backend/public/img : proxy indispensable en dev
      "/img": { target: apiTarget },
    },
  },
});

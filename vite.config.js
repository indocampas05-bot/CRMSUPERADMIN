import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target:
          "https://crmbackend-5d2o.onrender.com",
        changeOrigin: true,
        secure: false,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    },
  },
});
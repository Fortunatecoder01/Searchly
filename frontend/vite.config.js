
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      "/applications": "http://127.0.0.1:8000",
      "/recommendations": "http://127.0.0.1:8000",
      "/jobs": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/saved_jobs": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/saved_searches": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
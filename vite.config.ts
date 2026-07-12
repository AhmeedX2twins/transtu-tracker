import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local dev only: everything runs on your machine, nothing paid, nothing cloud
// except the two things the original brief already relied on — OpenStreetMap
// tiles and the existing public Supabase "Trackini" GPS feed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
      "/uploads": "http://localhost:8787",
    },
  },
});

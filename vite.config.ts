import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['@tanstack/react-router'],
          'vendor-ui': ['lucide-react', '@radix-ui/react-dialog', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-db': ['@supabase/supabase-js']
        }
      }
    }
  }
});

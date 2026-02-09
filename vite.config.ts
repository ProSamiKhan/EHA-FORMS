
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
  // Ye block Vercel ke environment variables ko browser mein accessible banata hai
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});

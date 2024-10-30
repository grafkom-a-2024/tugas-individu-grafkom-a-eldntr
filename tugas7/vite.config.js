import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        animation: 'Animation.html',
        panorama: 'Panorama.html',
        geometry: 'Geometery.html'
      }
    }
  }
});
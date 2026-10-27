import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: 'static',
  site: 'https://webexe.pl',
  vite: {
    resolve: {
      alias: {
        '@core': path.resolve(__dirname, 'src/core'),
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@gl': path.resolve(__dirname, 'src/gl'),
        '@components': path.resolve(__dirname, 'src/components'),
      },
    },
  },
});

import { defineConfig } from 'astro/config';

// URL del sitio — actualizado al repositorio proporcionado
const SITE = process.env.SITE || 'https://josetra44.github.io/interactivo';

export default defineConfig({
  site: SITE,
  base: '/interactivo/',
});

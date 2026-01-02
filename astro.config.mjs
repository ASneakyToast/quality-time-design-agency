// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://qualitytime.fun',
  output: 'static',
  integrations: [mdx(), sitemap()],
  image: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'storage.googleapis.com',
      pathname: '/quality-time-assets/**'
    }]
  },
  prefetch: false,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
  },
});

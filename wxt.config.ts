import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  srcDir: 'src',
  outDir: '.output',
  manifest: {
    name: 'Visboard',
    description: 'Futuristic browser annotation with laser-pointer precision.',
    permissions: ['storage', 'activeTab'],
    commands: {
      'toggle-laser': {
        suggested_key: {
          default: 'Ctrl+Shift+L',
          mac: 'Command+Shift+L',
        },
        description: 'Toggle Visboard annotation mode',
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
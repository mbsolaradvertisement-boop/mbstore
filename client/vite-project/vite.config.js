import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  // package.json and the private environment file live one directory above
  // Vite's application root.
  envDir: '..',
  resolve: {
    // The package manifest lives in /client while Vite's source root is
    // /client/vite-project. Always bundle a single React runtime.
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})

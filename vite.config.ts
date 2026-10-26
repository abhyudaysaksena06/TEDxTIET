import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * A copy of index.html for the /tedxtiet mount, with every asset path made
 * absolute under it. The relative paths in index.html only resolve inside
 * /tedxtiet/ when the address ends in a slash, and the portfolio's Next.js
 * strips that slash; a script could restore it, but the browser's look-ahead
 * scanner fetches the head's assets before any script runs, so each first
 * visit sent a dozen requests to the portfolio's root. vercel.json serves
 * this page for the mount and index.html everywhere else.
 */
function mountedHtml(mount = '/tedxtiet/') {
  return {
    name: 'tedxtiet-mounted-html',
    apply: 'build' as const,
    enforce: 'post' as const,
    generateBundle(
      this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void },
      _: unknown,
      bundle: Record<string, { type: string; source?: string | Uint8Array }>
    ) {
      const page = bundle['index.html']
      if (!page || page.type !== 'asset') return
      const html = String(page.source).replace(/(\s(?:src|href))="\.\//g, `$1="${mount}`)
      this.emitFile({ type: 'asset', fileName: 'tedxtiet.html', source: html })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mountedHtml()],
  // Relative asset paths, so one build loads from the root of
  // tedxtiet-gamma.vercel.app AND from www.mrdev4u.com/tedxtiet, which the
  // portfolio rewrites onto this deployment. See src/assets/lib/basePath.ts.
  base: './',
  build: {
    rollupOptions: {
      output: {
        // three.js is only needed by the hero and the gallery; keeping it in
        // its own chunk stops it blocking first paint on text-only routes
        // rolldown wants the function form, not an object map
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/framer-motion')) return 'motion';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})

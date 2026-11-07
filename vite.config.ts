/*
 * Mapa de la costa de Rocha — Matías Nicolás Echeveste Cardozo
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: { chunkSizeWarningLimit: 1200 }, // MapLibre GL ocupa ~1 MB sin comprimir (~270 kB con gzip)
  test: { environment: 'node' },
})

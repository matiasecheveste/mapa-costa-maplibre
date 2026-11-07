/*
 * Mapa de la costa de Rocha — Matías Nicolás Echeveste Cardozo
 * Cálculos geográficos y operaciones sobre GeoJSON, independientes del mapa (se prueban sin navegador).
 */
import type { Feature, FeatureCollection, Point } from 'geojson'

export type Categoria = 'playa' | 'patrimonio' | 'faro' | 'area-protegida'

export interface Propiedades {
  id: string
  nombre: string
  categoria: Categoria
  localidad: string
  descripcion: string
}

export type Lugar = Feature<Point, Propiedades>
export type Lugares = FeatureCollection<Point, Propiedades>

export const CATEGORIAS: Record<Categoria, { nombre: string; color: string }> = {
  playa: { nombre: 'Playas', color: '#0284c7' },
  patrimonio: { nombre: 'Patrimonio', color: '#b45309' },
  faro: { nombre: 'Faros', color: '#dc2626' },
  'area-protegida': { nombre: 'Áreas protegidas', color: '#15803d' },
}

const RADIO_TIERRA_KM = 6371.0088

/** Distancia de gran círculo (fórmula del semiverseno) en kilómetros. */
export function distanciaKm([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function filtrar(lugares: Lugares, categorias: Set<Categoria>, texto = ''): Lugares {
  const buscado = normalizar(texto)
  return {
    type: 'FeatureCollection',
    features: lugares.features.filter(
      (f) =>
        categorias.has(f.properties.categoria) &&
        (!buscado || normalizar(`${f.properties.nombre} ${f.properties.localidad}`).includes(buscado)),
    ),
  }
}

/** Lugares ordenados por distancia a un punto, con la distancia calculada. */
export function masCercanos(lugares: Lugares, origen: [number, number], cantidad = 3) {
  return lugares.features
    .map((f) => ({ lugar: f, km: distanciaKm(origen, f.geometry.coordinates as [number, number]) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, cantidad)
}

/** Caja envolvente [oeste, sur, este, norte]; null si no hay puntos. */
export function envolvente(lugares: Lugares): [number, number, number, number] | null {
  if (lugares.features.length === 0) return null
  const lons = lugares.features.map((f) => f.geometry.coordinates[0]!)
  const lats = lugares.features.map((f) => f.geometry.coordinates[1]!)
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]
}

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export function formatoDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km`
}

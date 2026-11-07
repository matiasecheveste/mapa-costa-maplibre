/*
 * Mapa de la costa de Rocha — Matías Nicolás Echeveste Cardozo
 * Pruebas de los cálculos geográficos y de la integridad del GeoJSON.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CATEGORIAS, distanciaKm, envolvente, filtrar, formatoDistancia, masCercanos, type Categoria, type Lugares } from '../src/geo'

const lugares = JSON.parse(readFileSync(new URL('../src/datos/lugares.geojson', import.meta.url), 'utf8')) as Lugares
const todas = new Set(Object.keys(CATEGORIAS) as Categoria[])

describe('datos GeoJSON', () => {
  it('tiene identificadores únicos, categorías conocidas y coordenadas dentro de Rocha', () => {
    const ids = lugares.features.map((f) => f.properties.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const f of lugares.features) {
      expect(f.geometry.type).toBe('Point')
      expect(Object.keys(CATEGORIAS)).toContain(f.properties.categoria)
      const [lon, lat] = f.geometry.coordinates as [number, number]
      expect(lon).toBeGreaterThan(-54.9)
      expect(lon).toBeLessThan(-53.1)
      expect(lat).toBeGreaterThan(-34.9)
      expect(lat).toBeLessThan(-33.5)
    }
  })
})

describe('geo', () => {
  it('calcula distancias de gran círculo', () => {
    expect(distanciaKm([0, 0], [0, 0])).toBe(0)
    // Un grado de latitud ≈ 111,2 km
    expect(distanciaKm([0, 0], [0, 1])).toBeCloseTo(111.19, 1)
    // Chuy – La Paloma: unos 125 km en línea recta
    expect(distanciaKm([-53.387, -33.747], [-54.162, -34.645])).toBeGreaterThan(115)
    expect(distanciaKm([-53.387, -33.747], [-54.162, -34.645])).toBeLessThan(130)
  })

  it('filtra por categoría y texto sin distinguir tildes', () => {
    expect(filtrar(lugares, new Set<Categoria>(['faro']), '').features).toHaveLength(2)
    expect(filtrar(lugares, todas, 'polonio').features.map((f) => f.properties.id).sort()).toEqual(['cabo-polonio-playa', 'faro-cabo-polonio'])
    expect(filtrar(lugares, todas, 'MARÍA').features).toHaveLength(1)
    expect(filtrar(lugares, new Set(), '').features).toHaveLength(0)
  })

  it('ordena por cercanía', () => {
    const [primero, segundo] = masCercanos(lugares, [-53.39, -33.75], 2)
    expect(primero!.lugar.properties.id).toBe('barra-del-chuy')
    expect(primero!.km).toBeLessThan(1)
    expect(segundo!.km).toBeGreaterThan(primero!.km)
  })

  it('calcula la caja envolvente', () => {
    const [oeste, sur, este, norte] = envolvente(lugares)!
    expect(oeste).toBeLessThan(este)
    expect(sur).toBeLessThan(norte)
    expect(envolvente({ type: 'FeatureCollection', features: [] })).toBeNull()
  })

  it('formatea distancias', () => {
    expect(formatoDistancia(0.35)).toBe('350 m')
    expect(formatoDistancia(12.345)).toBe('12,3 km')
  })
})

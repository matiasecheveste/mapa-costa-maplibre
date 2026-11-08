/*
 * Mapa de la costa de Rocha — Matías Nicolás Echeveste Cardozo
 * Mapa interactivo con MapLibre GL JS: capas GeoJSON con agrupamiento, filtros, búsqueda y lugares cercanos.
 */
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import urlTrabajador from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import datos from './datos/lugares.geojson?raw'
import { CATEGORIAS, envolvente, filtrar, formatoDistancia, masCercanos, type Categoria, type Lugar, type Lugares } from './geo'
import './estilos.css'

const LUGARES = JSON.parse(datos) as Lugares
const activas = new Set(Object.keys(CATEGORIAS) as Categoria[])
let texto = ''

// MapLibre 6 carga su worker como archivo aparte: se publica con el resto del sitio y se le indica la ruta.
maplibregl.setWorkerUrl(urlTrabajador)

const mapa = new maplibregl.Map({
  container: 'mapa',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  bounds: envolvente(LUGARES)!,
  fitBoundsOptions: { padding: 48 },
  attributionControl: { compact: true },
})
mapa.addControl(new maplibregl.NavigationControl(), 'top-right')
mapa.addControl(new maplibregl.ScaleControl({ unit: 'metric' }))

// Expresión «match» armada a partir de CATEGORIAS: ['match', ['get', 'categoria'], 'playa', '#…', …, color por defecto]
const colorPorCategoria = [
  'match',
  ['get', 'categoria'],
  ...Object.entries(CATEGORIAS).flatMap(([c, { color }]) => [c, color]),
  '#64748b',
] as unknown as maplibregl.ExpressionSpecification

mapa.on('load', () => {
  mapa.addSource('lugares', { type: 'geojson', data: LUGARES, cluster: true, clusterRadius: 40, clusterMaxZoom: 9 })
  mapa.addLayer({
    id: 'grupos',
    type: 'circle',
    source: 'lugares',
    filter: ['has', 'point_count'],
    paint: { 'circle-color': '#334155', 'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22], 'circle-opacity': 0.85 },
  })
  mapa.addLayer({
    id: 'grupos-cantidad',
    type: 'symbol',
    source: 'lugares',
    filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Noto Sans Bold'] },
    paint: { 'text-color': '#ffffff' },
  })
  mapa.addLayer({
    id: 'puntos',
    type: 'circle',
    source: 'lugares',
    filter: ['!', ['has', 'point_count']],
    paint: { 'circle-color': colorPorCategoria, 'circle-radius': 8, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
  })

  mapa.on('click', 'grupos', async (e: MapLayerMouseEvent) => {
    const grupo = e.features![0]!
    const fuente = mapa.getSource('lugares') as GeoJSONSource
    const zoom = await fuente.getClusterExpansionZoom(grupo.properties.cluster_id as number)
    mapa.easeTo({ center: (grupo.geometry as GeoJSON.Point).coordinates as [number, number], zoom })
  })
  mapa.on('click', 'puntos', (e: MapLayerMouseEvent) => mostrar(e.features![0] as unknown as Lugar))
  for (const capa of ['grupos', 'puntos']) {
    mapa.on('mouseenter', capa, () => (mapa.getCanvas().style.cursor = 'pointer'))
    mapa.on('mouseleave', capa, () => (mapa.getCanvas().style.cursor = ''))
  }
  actualizar()
})

let ventana: maplibregl.Popup | undefined
function mostrar(lugar: Lugar) {
  const coordenadas = lugar.geometry.coordinates as [number, number]
  const contenido = document.createElement('div')
  const titulo = document.createElement('strong')
  titulo.textContent = lugar.properties.nombre
  const detalle = document.createElement('p')
  detalle.textContent = `${CATEGORIAS[lugar.properties.categoria].nombre} · ${lugar.properties.localidad}`
  const descripcion = document.createElement('p')
  descripcion.textContent = lugar.properties.descripcion
  contenido.append(titulo, detalle, descripcion)
  ventana?.remove()
  ventana = new maplibregl.Popup({ offset: 12 }).setLngLat(coordenadas).setDOMContent(contenido).addTo(mapa)
  mapa.easeTo({ center: coordenadas })
}

function actualizar() {
  const visibles = filtrar(LUGARES, activas, texto)
  ;(mapa.getSource('lugares') as GeoJSONSource | undefined)?.setData(visibles)
  const lista = document.getElementById('lista')!
  lista.replaceChildren(
    ...visibles.features.map((f) => {
      const item = document.createElement('li')
      const boton = document.createElement('button')
      boton.type = 'button'
      boton.textContent = f.properties.nombre
      boton.style.setProperty('--color', CATEGORIAS[f.properties.categoria].color)
      boton.addEventListener('click', () => {
        mapa.flyTo({ center: f.geometry.coordinates as [number, number], zoom: 12 })
        mostrar(f)
      })
      item.append(boton)
      return item
    }),
  )
  const n = visibles.features.length
  document.getElementById('conteo')!.textContent =
    n === 0 ? 'Ningún lugar coincide con la búsqueda.' : `${n} ${n === 1 ? 'lugar' : 'lugares'}`
  return visibles
}

// Al buscar, el mapa se ajusta a los resultados (con una pequeña espera para no moverlo en cada tecla).
let espera: ReturnType<typeof setTimeout> | undefined
function encuadrar(visibles: Lugares) {
  clearTimeout(espera)
  espera = setTimeout(() => {
    const caja = envolvente(visibles.features.length ? visibles : LUGARES)
    if (caja) mapa.fitBounds(caja, { padding: 64, maxZoom: 12 })
  }, 400)
}

const filtros = document.getElementById('filtros')!
for (const [clave, { nombre, color }] of Object.entries(CATEGORIAS)) {
  const etiqueta = document.createElement('label')
  etiqueta.style.setProperty('--color', color)
  const casilla = Object.assign(document.createElement('input'), { type: 'checkbox', checked: true })
  casilla.addEventListener('change', () => {
    if (casilla.checked) activas.add(clave as Categoria)
    else activas.delete(clave as Categoria)
    actualizar()
  })
  etiqueta.append(casilla, ` ${nombre}`)
  filtros.append(etiqueta)
}

document.getElementById('buscar')!.addEventListener('input', (e) => {
  texto = (e.target as HTMLInputElement).value
  encuadrar(actualizar())
})

document.getElementById('cercanos')!.addEventListener('click', () => {
  const salida = document.getElementById('resultado-cercanos')!
  if (!navigator.geolocation) return void (salida.textContent = 'El navegador no permite obtener la ubicación.')
  salida.textContent = 'Buscando su ubicación…'
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const origen: [number, number] = [coords.longitude, coords.latitude]
      new maplibregl.Marker({ color: '#7c3aed' }).setLngLat(origen).addTo(mapa)
      const cercanos = masCercanos(filtrar(LUGARES, activas, texto), origen)
      salida.textContent = cercanos.map((c) => `${c.lugar.properties.nombre} (${formatoDistancia(c.km)})`).join(' · ')
    },
    () => (salida.textContent = 'No se pudo obtener la ubicación.'),
    { enableHighAccuracy: false, timeout: 10_000 },
  )
})

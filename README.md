# Mapa de la costa de Rocha

Mapa interactivo de playas, faros, sitios patrimoniales y áreas protegidas de la costa de Rocha (Uruguay), con
filtros por categoría, búsqueda, agrupamiento de puntos y lugares más cercanos a la ubicación del usuario.

**Tecnologías:** MapLibre GL JS, GeoJSON, TypeScript (sin framework), Vite, Vitest y GitHub Actions. Mapa base de
OpenFreeMap con datos de OpenStreetMap (sin clave de API). Publicado en Vercel.

## Qué demuestra

- **Mapas vectoriales con MapLibre:** fuente GeoJSON con *clustering*, capas `circle` y `symbol`, color por
  categoría con expresiones `match`, zoom de expansión al tocar un grupo, ventanas emergentes y controles.
- **Datos geográficos en GeoJSON** validados por pruebas (identificadores únicos, categorías conocidas y
  coordenadas dentro del departamento).
- **Cálculos geográficos propios:** distancia de gran círculo (semiverseno), ordenamiento por cercanía y caja
  envolvente para encuadrar el mapa.
- **Geolocalización** opcional para listar los tres lugares más cercanos.
- **TypeScript sin framework:** manipulación del DOM segura (`textContent`, nunca HTML interpolado).
- **CSP compatible con MapLibre** (workers `blob:` y teselas sólo desde el proveedor del mapa base).

## Uso

```bash
npm install
npm run dev
npm test
npm run build
```

Las ubicaciones son aproximadas y tienen fines demostrativos.

## Autoría

Desarrollado por **Matías Nicolás Echeveste Cardozo**. Licencia MIT.

import mapboxgl from 'mapbox-gl';

/**
 * Configures and enhances the native railway layers already present in the Mapbox Streets style.
 *
 * In the default Mapbox Streets v12 style, railway tracks ('major_rail' and 'minor_rail' in the 'road' source-layer)
 * exist in layers 'road-rail', 'road-rail-tracks', 'bridge-rail', and 'bridge-rail-tracks', but are configured with
 * minzoom: 13 and a faint 0.5px line color.
 *
 * This function:
 * 1. Lowers minzoom so the railway network is clearly visible across regional zooms (zoom 7+)
 * 2. Enhances the line paint properties to make railway tracks distinguishable from roads
 *    while remaining subtle and placed below connection lines and station markers.
 * 3. Preserves the classic railway track sleeper pattern at detailed zoom levels (zoom 12+).
 */
export function enableMapboxRailwayLayers(map: mapboxgl.Map): void {
  // 1. Continuous railway line (surface / ground level)
  if (map.getLayer('road-rail')) {
    map.setLayerZoomRange('road-rail', 7, 24);
    map.setPaintProperty('road-rail', 'line-color', [
      'interpolate',
      ['linear'],
      ['zoom'],
      7,
      '#94a3b8',
      10,
      '#64748b',
      14,
      '#475569'
    ]);
    map.setPaintProperty('road-rail', 'line-width', [
      'interpolate',
      ['exponential', 1.4],
      ['zoom'],
      7,
      1.0,
      10,
      1.6,
      14,
      2.6,
      18,
      4.0
    ]);
    map.setPaintProperty('road-rail', 'line-opacity', 0.85);
  }

  // 2. Railway sleeper / tie cross-dash pattern (surface / ground level)
  if (map.getLayer('road-rail-tracks')) {
    map.setLayerZoomRange('road-rail-tracks', 12, 24);
    map.setPaintProperty('road-rail-tracks', 'line-color', '#334155');
    map.setPaintProperty('road-rail-tracks', 'line-width', [
      'interpolate',
      ['exponential', 1.4],
      ['zoom'],
      12,
      3.0,
      14,
      4.5,
      18,
      8.0
    ]);
    map.setPaintProperty('road-rail-tracks', 'line-dasharray', [0.1, 4]);
    map.setPaintProperty('road-rail-tracks', 'line-opacity', [
      'interpolate',
      ['linear'],
      ['zoom'],
      12,
      0,
      12.5,
      0.9
    ]);
  }

  // 3. Continuous railway line on bridges
  if (map.getLayer('bridge-rail')) {
    map.setLayerZoomRange('bridge-rail', 7, 24);
    map.setPaintProperty('bridge-rail', 'line-color', [
      'interpolate',
      ['linear'],
      ['zoom'],
      7,
      '#94a3b8',
      10,
      '#64748b',
      14,
      '#475569'
    ]);
    map.setPaintProperty('bridge-rail', 'line-width', [
      'interpolate',
      ['exponential', 1.4],
      ['zoom'],
      7,
      1.0,
      10,
      1.6,
      14,
      2.6,
      18,
      4.0
    ]);
    map.setPaintProperty('bridge-rail', 'line-opacity', 0.85);
  }

  // 4. Railway sleeper / tie cross-dash pattern on bridges
  if (map.getLayer('bridge-rail-tracks')) {
    map.setLayerZoomRange('bridge-rail-tracks', 12, 24);
    map.setPaintProperty('bridge-rail-tracks', 'line-color', '#334155');
    map.setPaintProperty('bridge-rail-tracks', 'line-width', [
      'interpolate',
      ['exponential', 1.4],
      ['zoom'],
      12,
      3.0,
      14,
      4.5,
      18,
      8.0
    ]);
    map.setPaintProperty('bridge-rail-tracks', 'line-dasharray', [0.1, 4]);
    map.setPaintProperty('bridge-rail-tracks', 'line-opacity', [
      'interpolate',
      ['linear'],
      ['zoom'],
      12,
      0,
      12.5,
      0.9
    ]);
  }
}

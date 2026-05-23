import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() latitude!: number | null;
  @Input() longitude!: number | null;
  @Input() stationName: string | null = "Sint-Niklaas";
  private map!: mapboxgl.Map;
  private marker!: mapboxgl.Marker;
  private platformId = inject(PLATFORM_ID);
  private rotationActive = false;
  private rotationFrameId?: number;
  private pendingCoords: [number, number] | null = null;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    mapboxgl.accessToken = environment.mapboxToken;

    const initialCoords: [number, number] = [
      this.longitude ?? 4.35,
      this.latitude ?? 50.85
    ];

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCoords,
      zoom: 7,
      pitch: 65,
      bearing: 0,
      antialias: true
    });

    this.marker = new mapboxgl.Marker()
      .setLngLat(initialCoords)
      .addTo(this.map);

    this.map.setMaxPitch(85);

    this.map.on('load', () => {
      this.map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });

      this.map.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 1.5
      });
      this.startAutoRotate();
      this.add3DBuildings();
      this.addStationsLayer();
      if (this.pendingCoords) {
        this.updateMap(this.pendingCoords);
        this.pendingCoords = null;
      }
    });

    this.map.on('dragstart', () => {
      this.stopAutoRotate();
    });
    this.map.on('touchstart', () => {
      this.stopAutoRotate();
    });

    this.map.on('mousedown', () => {
      this.stopAutoRotate();
    });
    this.map.on('moveend', () => {
      if (!this.rotationActive) {
        this.startAutoRotate();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.latitude == null || this.longitude == null) return;

    const coords: [number, number] = [this.longitude, this.latitude];

    if (!this.map) {
      this.pendingCoords = coords;
      return;
    }

    this.updateMap(coords);
  }
  private startAutoRotate() {
    if (this.rotationActive) return;

    this.rotationActive = true;
    const rotate = () => {
      if (!this.map || !this.rotationActive) return;

      this.map.setBearing(
        (this.map.getBearing() + 0.05) % 360
      );

      this.rotationFrameId = requestAnimationFrame(rotate);
    };

    rotate();
  }

  private stopAutoRotate() {
    this.rotationActive = false;

    if (this.rotationFrameId) {
      cancelAnimationFrame(this.rotationFrameId);
    }
  }

  private updateMap(coords: [number, number]) {
    if (!this.map || !this.marker) return;

    this.map.flyTo({
      center: coords,
      zoom: 18,
      pitch: 70,
      // bearing: this.map.getBearing(),
      speed: 10,
      curve: 1.4,
      essential: true
    });

    this.marker.setLngLat(coords);
    this.stopAutoRotate();
    setTimeout(() => {
      this.startAutoRotate();
    }, 3000)
  }

  private add3DBuildings() {
    const layers = this.map.getStyle().layers!;
    const labelLayerId = layers.find(
      (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    this.map.addLayer(
      {
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 0,
            14.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 0,
            14.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      },
      labelLayerId
    );
  }

  private addStationsLayer() {
    this.map.addSource('stations', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: this.stationName },
            geometry: {
              type: 'Point',
              coordinates: [this.longitude ?? 4.35, this.latitude ?? 50.85]
            }
          }
        ]
      }
    });

    this.map.addLayer({
      id: 'stations-layer',
      type: 'circle',
      source: 'stations',
      paint: {
        'circle-radius': 7,
        'circle-color': '#ff2d2d',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
    if (this.map) {
      this.map.remove();
    }
  }
}
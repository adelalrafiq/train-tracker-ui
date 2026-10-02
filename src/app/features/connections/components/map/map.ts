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
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { MapLine, MapMarker } from '../../models/connectionsModel';
import { enableMapboxRailwayLayers } from '../../../../shared/utils/mapbox-railway';

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() center: [number, number] = [4.3572, 50.8476]; // [lng, lat]
  @Input() zoom = 8;
  @Input() markers: MapMarker[] = [];
  @Input() line?: MapLine;
  @Input() distanceText: string | null = null;
  @Input() isMobileMode = false;

  private map?: mapboxgl.Map;
  private markerInstances: mapboxgl.Marker[] = [];
  private platformId = inject(PLATFORM_ID);
  private isMapLoaded = false;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    mapboxgl.accessToken = environment.mapboxToken;
    (mapboxgl as any).workerUrl = '/mapbox-gl-csp-worker.js';

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: this.center,
      zoom: this.zoom,
      attributionControl: false
    });

    this.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    this.map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    this.map.on('load', () => {
      this.isMapLoaded = true;
      enableMapboxRailwayLayers(this.map!);
      this.setupLayers();
      this.renderMarkers();
      this.renderLine();
      this.fitBoundsIfPossible();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map || !this.isMapLoaded) return;

    if (changes['markers']) {
      this.renderMarkers();
    }

    if (changes['line']) {
      this.renderLine();
      this.fitBoundsIfPossible();
    } else if (changes['center'] && !this.line) {
      this.map.flyTo({ center: this.center, zoom: this.zoom, duration: 800 });
    }

    if (changes['isMobileMode']) {
      setTimeout(() => {
        this.resize();
        this.fitBoundsIfPossible();
      }, 100);
    }
  }

  resize(): void {
    if (this.map) {
      this.map.resize();
    }
  }

  private setupLayers(): void {
    if (!this.map) return;

    if (!this.map.getSource('route-line')) {
      this.map.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }

    if (!this.map.getLayer('route-layer-casing')) {
      this.map.addLayer({
        id: 'route-layer-casing',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 6,
          'line-opacity': 0.8
        }
      });
    }

    if (!this.map.getLayer('route-layer')) {
      this.map.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#003082',
          'line-width': 3.5,
          'line-opacity': 0.95
        }
      });
    }
  }

  private renderMarkers(): void {
    this.markerInstances.forEach(m => m.remove());
    this.markerInstances = [];

    if (!this.map) return;

    this.markers.forEach((m, idx) => {
      const isOrigin = idx === 0;
      const el = document.createElement('div');
      el.className = 'connection-marker cursor-pointer';

      const bg = isOrigin ? '#003082' : '#dc2626';
      const labelType = isOrigin ? 'Vertrek' : 'Aankomst';

      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;user-select:none;">
          <div style="background:${bg};color:#ffffff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;border:2px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.3);white-space:nowrap;font-family:system-ui,sans-serif;">
            ${m.label}
          </div>
          <div style="width:12px;height:12px;background:${bg};border:2px solid #ffffff;border-radius:50%;margin-top:-2px;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>
        </div>
      `;

      const popupHtml = `
        <div style="font-family:system-ui,sans-serif;padding:6px;">
          <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">${labelType}</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:2px;">${m.label}</div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(m.lngLat)
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(popupHtml))
        .addTo(this.map!);

      this.markerInstances.push(marker);
    });
  }

  private renderLine(): void {
    if (!this.map || !this.isMapLoaded) return;
    const source = this.map.getSource('route-line') as mapboxgl.GeoJSONSource;
    if (!source) return;

    if (!this.line) {
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
      return;
    }

    source.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [this.line.from, this.line.to]
      }
    });
  }

  fitBoundsIfPossible(): void {
    if (!this.map || !this.line) return;

    const bounds = new mapboxgl.LngLatBounds(this.line.from, this.line.to);

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

    const leftPadding = this.isMobileMode ? 40 : (isDesktop ? 450 : (isTablet ? 380 : 40));

    this.map.fitBounds(bounds, {
      padding: {
        top: 80,
        bottom: 80,
        left: leftPadding,
        right: 60
      },
      maxZoom: 12,
      duration: 1200
    });
  }

  ngOnDestroy(): void {
    this.markerInstances.forEach(m => m.remove());
    if (this.map) {
      this.map.remove();
    }
  }
}

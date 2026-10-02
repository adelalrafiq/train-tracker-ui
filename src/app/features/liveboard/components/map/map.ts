import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
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
import { enableMapboxRailwayLayers } from '../../../../shared/utils/mapbox-railway';

export interface LiveboardDestinationOnMap {
  name: string;
  lat: number;
  lng: number;
  trainInfo: string;
  departureTime: string;
  delayMinutes: number;
  platform: string;
  statusText: string;
}

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() stationName: string | null = 'Sint-Niklaas';
  @Input() destinations: LiveboardDestinationOnMap[] = [];
  @Input() highlightedDestination: string | null = null;
  @Input() isMobileMode = false;
  @Output() destinationSelected = new EventEmitter<string>();

  private map?: mapboxgl.Map;
  private originMarker?: mapboxgl.Marker;
  private destinationMarkers: mapboxgl.Marker[] = [];
  private platformId = inject(PLATFORM_ID);
  private isMapLoaded = false;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    mapboxgl.accessToken = environment.mapboxToken;
    (mapboxgl as any).workerUrl = '/mapbox-gl-csp-worker.js';

    const initialCoords: [number, number] = [
      this.longitude ?? 4.3572,
      this.latitude ?? 50.8476
    ];

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCoords,
      zoom: 8,
      attributionControl: false
    });

    this.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    this.map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    this.map.on('load', () => {
      this.isMapLoaded = true;
      enableMapboxRailwayLayers(this.map!);
      this.setupConnectionLayers();
      this.renderOriginMarker();
      this.renderDestinations();
      this.fitMapBounds();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map || !this.isMapLoaded) return;

    if (changes['latitude'] || changes['longitude'] || changes['stationName']) {
      this.renderOriginMarker();
      this.renderDestinations();
      this.fitMapBounds();
    } else if (changes['destinations']) {
      this.renderDestinations();
      this.fitMapBounds();
    }

    if (changes['highlightedDestination'] && this.map) {
      this.updateHighlightLayer();
    }

    if (changes['isMobileMode'] && this.map) {
      setTimeout(() => {
        this.resize();
        this.fitMapBounds();
      }, 100);
    }
  }

  resize(): void {
    if (this.map) {
      this.map.resize();
    }
  }

  private setupConnectionLayers(): void {
    if (!this.map) return;

    if (!this.map.getSource('liveboard-connections')) {
      this.map.addSource('liveboard-connections', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }

    if (!this.map.getSource('liveboard-highlight-connection')) {
      this.map.addSource('liveboard-highlight-connection', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
    }

    if (!this.map.getLayer('liveboard-connections-layer')) {
      this.map.addLayer({
        id: 'liveboard-connections-layer',
        type: 'line',
        source: 'liveboard-connections',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0052cc',
          'line-width': 2.5,
          'line-dasharray': [2, 1.5],
          'line-opacity': 0.75
        }
      });
    }

    if (!this.map.getLayer('liveboard-highlight-connection-layer')) {
      this.map.addLayer({
        id: 'liveboard-highlight-connection-layer',
        type: 'line',
        source: 'liveboard-highlight-connection',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f59e0b',
          'line-width': 4.5,
          'line-opacity': 0.95
        }
      });
    }
  }

  private renderOriginMarker(): void {
    if (!this.map) return;

    if (this.originMarker) {
      this.originMarker.remove();
      this.originMarker = undefined;
    }

    if (this.latitude == null || this.longitude == null) return;

    const el = document.createElement('div');
    el.className = 'origin-station-marker';
    el.innerHTML = `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(0,75,172,0.25);animation:pulse 2s infinite ease-in-out;"></div>
        <div style="width:30px;height:30px;background:#003082;border:3px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,48,130,0.6);color:#ffffff;font-size:14px;font-weight:bold;">
          B
        </div>
      </div>
    `;

    const popupHtml = `
      <div style="font-family:system-ui,sans-serif;padding:4px 6px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#003082;font-weight:700;">Vertrekstation</div>
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:2px;">${this.stationName || 'Geselecteerd station'}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">${this.destinations.length} directe bestemmingen</div>
      </div>
    `;

    this.originMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([this.longitude, this.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(popupHtml))
      .addTo(this.map);
  }

  private renderDestinations(): void {
    if (!this.map || !this.isMapLoaded) return;

    // Clear existing destination markers
    this.destinationMarkers.forEach(m => m.remove());
    this.destinationMarkers = [];

    if (this.latitude == null || this.longitude == null) return;

    const lineFeatures: any[] = [];

    this.destinations.forEach(dest => {
      // 1. Connection line GeoJSON feature (straight geographic visualization)
      lineFeatures.push({
        type: 'Feature',
        properties: {
          destination: dest.name
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [this.longitude!, this.latitude!],
            [dest.lng, dest.lat]
          ]
        }
      });

      // 2. Destination Marker element
      const el = document.createElement('div');
      el.className = 'destination-station-marker cursor-pointer';
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:4px;padding:3px 8px;background:#ffffff;border:2px solid #0052cc;border-radius:12px;box-shadow:0 3px 8px rgba(0,0,0,0.2);transform:scale(0.9);transition:transform 0.2s ease;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#0052cc;"></span>
          <span style="font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;font-family:system-ui,sans-serif;">${dest.name}</span>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.08)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(0.9)';
      });
      el.addEventListener('click', () => {
        this.destinationSelected.emit(dest.name);
      });

      const delayBadge = dest.delayMinutes > 0
        ? `<span style="background:#ef4444;color:#fff;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:bold;">+${dest.delayMinutes} min</span>`
        : '';

      const platformBadge = dest.platform
        ? `<span style="background:#f1f5f9;color:#334155;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:600;">Spoor ${dest.platform}</span>`
        : '';

      const popupContent = `
        <div style="font-family:system-ui,sans-serif;padding:6px;min-width:160px;">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600;">Directe verbinding</div>
          <div style="font-size:15px;font-weight:700;color:#0f172a;margin-top:2px;">${dest.name}</div>
          <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between;gap:6px;">
            <span style="font-size:13px;font-weight:600;color:#003082;">${dest.trainInfo}</span>
            <span style="font-size:13px;font-weight:700;color:#0f172a;">${dest.departureTime}</span>
          </div>
          <div style="margin-top:6px;display:flex;gap:4px;align-items:center;">
            ${platformBadge}
            ${delayBadge}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([dest.lng, dest.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(popupContent))
        .addTo(this.map!);

      this.destinationMarkers.push(marker);
    });

    // Update lines source data
    const source = this.map.getSource('liveboard-connections') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: lineFeatures
      });
    }

    this.updateHighlightLayer();
  }

  private updateHighlightLayer(): void {
    if (!this.map || !this.isMapLoaded) return;
    const highlightSource = this.map.getSource('liveboard-highlight-connection') as mapboxgl.GeoJSONSource;
    if (!highlightSource) return;

    if (!this.highlightedDestination || this.latitude == null || this.longitude == null) {
      highlightSource.setData({
        type: 'FeatureCollection',
        features: []
      });
      return;
    }

    const targetDest = this.destinations.find(d =>
      d.name.toLowerCase() === this.highlightedDestination?.toLowerCase()
    );

    if (targetDest) {
      highlightSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { destination: targetDest.name },
            geometry: {
              type: 'LineString',
              coordinates: [
                [this.longitude, this.latitude],
                [targetDest.lng, targetDest.lat]
              ]
            }
          }
        ]
      });

      // Find and open popup for highlighted destination
      const markerIndex = this.destinations.indexOf(targetDest);
      if (markerIndex >= 0 && this.destinationMarkers[markerIndex]) {
        const popup = this.destinationMarkers[markerIndex].getPopup();
        if (popup && !popup.isOpen()) {
          popup.addTo(this.map);
        }
      }
    } else {
      highlightSource.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }

  fitMapBounds(): void {
    if (!this.map || this.latitude == null || this.longitude == null) return;

    const points: [number, number][] = [[this.longitude, this.latitude]];
    this.destinations.forEach(d => {
      points.push([d.lng, d.lat]);
    });

    if (points.length === 1) {
      this.map.flyTo({
        center: points[0],
        zoom: 12,
        duration: 1000
      });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
    for (let i = 1; i < points.length; i++) {
      bounds.extend(points[i]);
    }

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

    const leftPadding = this.isMobileMode ? 40 : (isDesktop ? 440 : (isTablet ? 380 : 40));

    this.map.fitBounds(bounds, {
      padding: {
        top: 60,
        bottom: 60,
        left: leftPadding,
        right: 50
      },
      maxZoom: 12,
      duration: 1200
    });
  }

  focusDestination(destName: string): void {
    if (!this.map || this.latitude == null || this.longitude == null) return;
    const dest = this.destinations.find(d => d.name.toLowerCase() === destName.toLowerCase());
    if (!dest) return;

    const bounds = new mapboxgl.LngLatBounds([this.longitude, this.latitude], [dest.lng, dest.lat]);
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const leftPadding = this.isMobileMode ? 40 : (isDesktop ? 440 : 40);

    this.map.fitBounds(bounds, {
      padding: {
        top: 80,
        bottom: 80,
        left: leftPadding,
        right: 80
      },
      maxZoom: 13,
      duration: 800
    });

    this.highlightedDestination = dest.name;
    this.updateHighlightLayer();
  }

  ngOnDestroy(): void {
    this.destinationMarkers.forEach(m => m.remove());
    if (this.originMarker) {
      this.originMarker.remove();
    }
    if (this.map) {
      this.map.remove();
    }
  }
}

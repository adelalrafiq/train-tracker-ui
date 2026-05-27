import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../../environments/environment';
import { MapLine, MapMarker } from '../../models/connectionsModel';
@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @Input() center: [number, number] = [4.3572, 50.8476]; // [lng, lat]
  @Input() zoom = 7;
  @Input() markers: MapMarker[] = [];
  @Input() line?: MapLine;

  private map?: mapboxgl.Map;
  private markerInstances: mapboxgl.Marker[] = [];

  ngAfterViewInit(): void {
    mapboxgl.accessToken = environment.mapboxToken;
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: this.center,
      zoom: this.zoom,
      attributionControl: false
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    this.map.on('load', () => {
      this.renderMarkers();
      this.renderLine();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map?.loaded()) return;

    if (changes['center'] || changes['zoom']) {
      this.map.flyTo({ center: this.center, zoom: this.zoom, duration: 800 });
    }
    if (changes['markers']) {
      this.renderMarkers();
    }
    if (changes['line']) {
      this.renderLine();
    }
  }




  private renderMarkers(): void {
    this.markerInstances.forEach(m => m.remove());
    this.markerInstances = [];

    this.markers.forEach(m => {
      const el = document.createElement('div');
      el.className = 'train-marker';
      el.innerHTML = `
        <div style="
          width:32px;height:32px;background:#003082;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);border:3px solid white;
          box-shadow:0 2px 8px rgba(0,48,130,0.5);
        "></div>`;

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(m.lngLat)
        .setPopup(new mapboxgl.Popup({ offset: 28 }).setText(m.label))
        .addTo(this.map!);
      this.markerInstances.push(marker);
    });
  }

  private renderLine(): void {
    if (!this.map) return;
    const sourceId = 'route-line';
    const layerId = 'route-layer';

    if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
    if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);

    if (!this.line) return;

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [this.line.from, this.line.to],
        },
        properties: {},
      },
    });

    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#003082',
        'line-width': 3,
        'line-dasharray': [2, 2],
        'line-opacity': 0.8,
      },
    });
  }

  ngOnDestroy(): void {
    this.markerInstances.forEach(m => m.remove());
    this.map?.remove();
  }
}
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
import { environment } from '../../../environments/environment';
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
  private map!: mapboxgl.Map;
  private marker!: mapboxgl.Marker;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    (mapboxgl as any).accessToken = environment.mapboxToken;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [4.14, 51.17],
      zoom: 9
    });

    this.marker = new mapboxgl.Marker()
      .setLngLat([4.14, 51.17])
      .addTo(this.map);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.map || !this.latitude || !this.longitude) return;

    const coords: [number, number] = [this.longitude, this.latitude];
    this.map.flyTo({
      center: coords,
      zoom: 10,
      speed: 1.4,
      curve: 1.3,
      essential: true
    });
    this.marker.setLngLat(coords);
  }
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}

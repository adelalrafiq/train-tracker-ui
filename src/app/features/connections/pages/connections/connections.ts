import {
  Component,
  OnInit,
  inject,
  ViewChild
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConnectionsService } from '../../services/connections-service';
import { Autocomplete } from '../../../../shared/components/autocomplete/autocomplete';
import { MapMarker, MapLine, ConnectionDto } from '../../models/connectionsModel';
import { Map } from '../../components/map/map';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import {
  calculateGeographicDistanceKm,
  formatDistanceKm,
  StationCoordinatesService
} from '../../../../shared/services/station-coordinates-service';

@Component({
  selector: 'app-connections',
  imports: [
    Map,
    Autocomplete,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './connections.html',
  styleUrl: './connections.css',
})
export class Connections implements OnInit {
  @ViewChild(Map) mapComponent?: Map;

  private readonly connectionsService = inject(ConnectionsService);
  private readonly stationCoordinatesService = inject(StationCoordinatesService);

  private readonly _selectedFrom$ = new BehaviorSubject<string | null>(null);
  private readonly _selectedTo$ = new BehaviorSubject<string | null>(null);

  readonly selectedFrom$ = this._selectedFrom$.asObservable();
  readonly selectedTo$ = this._selectedTo$.asObservable();

  readonly connections$ = this.connectionsService.connections$;
  readonly loading$ = this.connectionsService.loading$;

  // Dedicated mobile interaction state
  mobileView: 'list' | 'map' = 'list';

  // Distance calculated between the two stations
  calculatedDistance: string | null = null;

  ngOnInit(): void {
    const recentFrom = localStorage.getItem('recentFrom');
    const recentTo = localStorage.getItem('recentTo');
    if (recentFrom) {
      this._selectedFrom$.next(recentFrom);
    }
    if (recentTo) {
      this._selectedTo$.next(recentTo);
    }

    // Subscribe to connections to compute distance and station coordinates
    this.connections$.subscribe(connections => {
      this.computeDistanceAndCoordinates(connections);
    });
  }

  setFromStation(station: string): void {
    this._selectedFrom$.next(station);
    localStorage.setItem('recentFrom', station);
    this.recalculateDistancePreview();
  }

  setToStation(station: string): void {
    this._selectedTo$.next(station);
    localStorage.setItem('recentTo', station);
    this.recalculateDistancePreview();
  }

  swapStations(): void {
    const from = this._selectedFrom$.value;
    const to = this._selectedTo$.value;
    this._selectedFrom$.next(to);
    this._selectedTo$.next(from);
    if (to) localStorage.setItem('recentFrom', to);
    if (from) localStorage.setItem('recentTo', from);
    this.recalculateDistancePreview();
    if (to && from) {
      this.search();
    }
  }

  search(): void {
    const from = this._selectedFrom$.value;
    const to = this._selectedTo$.value;

    if (!from || !to) return;

    this.connectionsService.searchConnections(from, to);
  }

  private computeDistanceAndCoordinates(connections: ConnectionDto[]): void {
    if (!connections || !connections.length) {
      this.recalculateDistancePreview();
      return;
    }

    const first = connections[0];
    if (first.departureLocation && first.arrivalLocation) {
      // Cache coordinates
      this.stationCoordinatesService.setCoordinates(
        first.departureStation,
        first.departureLocation.lat,
        first.departureLocation.lng
      );
      this.stationCoordinatesService.setCoordinates(
        first.arrivalStation,
        first.arrivalLocation.lat,
        first.arrivalLocation.lng
      );

      const dist = calculateGeographicDistanceKm(
        first.departureLocation.lat,
        first.departureLocation.lng,
        first.arrivalLocation.lat,
        first.arrivalLocation.lng
      );
      this.calculatedDistance = formatDistanceKm(dist);
    } else {
      this.recalculateDistancePreview();
    }
  }

  private recalculateDistancePreview(): void {
    const from = this._selectedFrom$.value;
    const to = this._selectedTo$.value;
    if (!from || !to) {
      this.calculatedDistance = null;
      return;
    }

    const coordFrom = this.stationCoordinatesService.getCoordinates(from);
    const coordTo = this.stationCoordinatesService.getCoordinates(to);

    if (coordFrom && coordTo) {
      const dist = calculateGeographicDistanceKm(
        coordFrom.lat,
        coordFrom.lng,
        coordTo.lat,
        coordTo.lng
      );
      this.calculatedDistance = formatDistanceKm(dist);
    } else {
      this.calculatedDistance = null;
    }
  }

  // -------------------------
  // MAP CENTER
  // -------------------------
  get mapCenter(): [number, number] {
    const connections = this.connectionsService.connectionsValue;

    if (connections.length > 0) {
      const c = connections[0];
      if (c.departureLocation && c.arrivalLocation) {
        return [
          (c.departureLocation.lng + c.arrivalLocation.lng) / 2,
          (c.departureLocation.lat + c.arrivalLocation.lat) / 2
        ];
      }
    }

    const from = this._selectedFrom$.value;
    const to = this._selectedTo$.value;
    const coordFrom = from ? this.stationCoordinatesService.getCoordinates(from) : null;
    const coordTo = to ? this.stationCoordinatesService.getCoordinates(to) : null;

    if (coordFrom && coordTo) {
      return [(coordFrom.lng + coordTo.lng) / 2, (coordFrom.lat + coordTo.lat) / 2];
    } else if (coordFrom) {
      return [coordFrom.lng, coordFrom.lat];
    }

    return [4.3572, 50.8476]; // Brussels coordinates in [lng, lat]
  }

  get mapZoom(): number {
    return 8;
  }

  // -------------------------
  // MAP MARKERS
  // -------------------------
  get mapMarkers(): MapMarker[] {
    const markers: MapMarker[] = [];
    const connections = this.connectionsService.connectionsValue;

    if (connections.length > 0) {
      const c = connections[0];
      if (c.departureLocation && c.arrivalLocation) {
        markers.push({
          lngLat: [c.departureLocation.lng, c.departureLocation.lat],
          label: c.departureStation
        });
        markers.push({
          lngLat: [c.arrivalLocation.lng, c.arrivalLocation.lat],
          label: c.arrivalStation
        });
        return markers;
      }
    }

    const from = this._selectedFrom$.value;
    const to = this._selectedTo$.value;
    const coordFrom = from ? this.stationCoordinatesService.getCoordinates(from) : null;
    const coordTo = to ? this.stationCoordinatesService.getCoordinates(to) : null;

    if (coordFrom) {
      markers.push({
        lngLat: [coordFrom.lng, coordFrom.lat],
        label: from!
      });
    }
    if (coordTo) {
      markers.push({
        lngLat: [coordTo.lng, coordTo.lat],
        label: to!
      });
    }

    return markers;
  }

  // -------------------------
  // MAP LINE
  // -------------------------
  get mapLine(): MapLine | undefined {
    const connections = this.connectionsService.connectionsValue;

    if (connections.length > 0) {
      const first = connections[0];
      if (first.departureLocation && first.arrivalLocation) {
        return {
          from: [first.departureLocation.lng, first.departureLocation.lat],
          to: [first.arrivalLocation.lng, first.arrivalLocation.lat]
        };
      }
    }

    const from = this._selectedFrom$.value;
    const to = this._selectedTo$.value;
    const coordFrom = from ? this.stationCoordinatesService.getCoordinates(from) : null;
    const coordTo = to ? this.stationCoordinatesService.getCoordinates(to) : null;

    if (coordFrom && coordTo) {
      return {
        from: [coordFrom.lng, coordFrom.lat],
        to: [coordTo.lng, coordTo.lat]
      };
    }

    return undefined;
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '—';
    const totalMinutes = Math.floor(seconds / 60);

    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}u ${minutes}m`;
  }

  setMobileView(view: 'list' | 'map'): void {
    this.mobileView = view;
    if (view === 'map') {
      setTimeout(() => {
        if (this.mapComponent) {
          this.mapComponent.resize();
          this.mapComponent.fitBoundsIfPossible();
        }
      }, 100);
    }
  }
}

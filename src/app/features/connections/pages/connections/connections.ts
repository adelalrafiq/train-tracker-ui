import {
  Component,
  inject
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConnectionsService } from '../../services/connections-service';
import { Autocomplete } from '../../../../shared/components/autocomplete/autocomplete';
import { MapMarker, MapLine } from '../../models/connectionsModel';
import { Map } from '../../components/map/map';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-connections',
  imports: [Map,
    Autocomplete,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './connections.html',
  styleUrl: './connections.css',
})
export class Connections {
  private readonly connectionsService = inject(ConnectionsService);
  private readonly _selectedFrom$ = new BehaviorSubject<string | null>(null);
  private readonly _selectedTo$ = new BehaviorSubject<string | null>(null);

  readonly selectedFrom$ = this._selectedFrom$.asObservable();
  readonly selectedTo$ = this._selectedTo$.asObservable();

  readonly connections$ = this.connectionsService.connections$;
  readonly loading$ = this.connectionsService.loading$;

  // -------------------------
  // INIT
  // -------------------------
  ngOnInit(): void {
    const recentFrom = localStorage.getItem('recentFrom');
    const recentTo = localStorage.getItem('recentTo');
    if (recentFrom) {
      this._selectedFrom$.next(recentFrom);
    }
    if (recentTo) {
      this._selectedTo$.next(recentTo);
    }
  }

  // -------------------------
  // SELECT
  // -------------------------

  setFromStation(station: string): void {
    this._selectedFrom$.next(station);
    localStorage.setItem('recentFrom', station);
  }

  setToStation(station: string): void {
    this._selectedTo$.next(station);
    localStorage.setItem('recentTo', station);
  }

  // -------------------------
  // SEARCH
  // -------------------------
  search(): void {
    const from = this._selectedFrom$.value;
    const to = this._selectedTo$.value;

    if (!from || !to) return;

    this.connectionsService.searchConnections(from, to);
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

    return [50.8476, 4.3572];
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

    connections.forEach(conn => {

      markers.push({
        lngLat: [
          conn.departureLocation.lng,
          conn.departureLocation.lat
        ],
        label: conn.departureStation
      });

      markers.push({
        lngLat: [
          conn.arrivalLocation.lng,
          conn.arrivalLocation.lat
        ],
        label: conn.arrivalStation
      });

    });

    return markers;
  }

  // -------------------------
  // MAP LINE
  // -------------------------
  get mapLine(): MapLine | undefined {
    const connections = this.connectionsService.connectionsValue;

    if (!connections.length) return undefined;

    const first = connections[0];

    return {
      from: [
        first.departureLocation.lng,
        first.departureLocation.lat
      ],
      to: [
        first.arrivalLocation.lng,
        first.arrivalLocation.lat
      ]
    };
  }

  // -------------------------
  // FORMAT DURATION
  // -------------------------
  formatDuration(seconds: number): string {
    const totalMinutes = Math.floor(seconds / 60);

    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }
}

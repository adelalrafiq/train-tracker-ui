import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Autocomplete } from '../../../../shared/components/autocomplete/autocomplete';
import { Map as LiveboardMap, LiveboardDestinationOnMap } from '../../components/map/map';
import { LiveboardService } from '../../services/liveboardService';
import { LiveboardRow, StationDto } from '../../models/liveboardModel';
import { StationCoordinatesService } from '../../../../shared/services/station-coordinates-service';

@Component({
  selector: 'app-liveboard',
  imports: [
    CommonModule,
    Autocomplete,
    LiveboardMap,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './liveboard.html',
  styleUrl: './liveboard.css',
})
export class Liveboard implements OnInit, OnDestroy {
  @ViewChild(LiveboardMap) mapComponent?: LiveboardMap;

  currentTime = new Date();
  selectedStation: string = 'Sint-Niklaas';
  rows: LiveboardRow[] = [];
  latitude: number | null = null;
  longitude: number | null = null;
  errorMessage: string | null = null;
  loading = false;
  showColon = true;
  isSecondPartVisible: boolean[] = [];

  // Map state
  destinationsOnMap: LiveboardDestinationOnMap[] = [];
  highlightedDestination: string | null = null;

  // Mobile dedicated UX state: 'list' (default on mobile) or 'map'
  mobileView: 'list' | 'map' = 'list';

  private fetchTimer!: any;
  private clockTimer!: any;
  private colonTimer!: any;
  private viaToggleTimer: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private liveboardService: LiveboardService,
    private stationCoordinatesService: StationCoordinatesService
  ) { }

  ngOnInit(): void {
    const savedStation = localStorage.getItem('lastStation') || 'Sint-Niklaas';
    this.selectedStation = savedStation;

    this.fetchData();

    // Auto-refresh data every 30s
    this.fetchTimer = setInterval(() => {
      this.fetchData();
    }, 30000);

    // Current clock
    this.clockTimer = setInterval(() => {
      this.currentTime = new Date();
    }, 60000);

    // Blinking colon
    this.colonTimer = setInterval(() => {
      this.showColon = !this.showColon;
      this.cdr.markForCheck();
    }, 1000);

    // Via text rotation
    this.viaToggleTimer = setInterval(() => {
      this.isSecondPartVisible = this.rows.map(() => false);
      this.rows.forEach((_, index) => {
        setTimeout(() => {
          this.isSecondPartVisible[index] = !this.isSecondPartVisible[index];
        }, index * 80);
      });
    }, 3000);
  }

  getFirstPart(stops: any[]): string {
    if (!stops || !stops.length) return '';
    return stops.slice(0, 2).map(stop => stop.station).join(', ');
  }

  getSecondPart(stops: any[]): string {
    if (!stops || stops.length <= 2) return '';
    return stops.slice(2).map(stop => stop.station).join(', ');
  }

  // Fetch real liveboard data
  async fetchData(): Promise<void> {
    if (!this.selectedStation) {
      return;
    }
    this.loading = true;
    this.errorMessage = null;

    try {
      const data = await this.liveboardService.getLiveboard(this.selectedStation);

      this.rows = (data?.rows || []).map((r: any) => Object.assign({}, r, {
        departureTime: new Date(r.departureTime)
      }));

      this.latitude = data?.latitude ?? null;
      this.longitude = data?.longitude ?? null;

      // Update station coordinates cache if returned
      if (this.latitude != null && this.longitude != null) {
        this.stationCoordinatesService.setCoordinates(
          this.selectedStation,
          this.latitude,
          this.longitude
        );
      } else {
        // Fallback to known station coordinates lookup
        const knownCoord = this.stationCoordinatesService.getCoordinates(this.selectedStation);
        if (knownCoord) {
          this.latitude = knownCoord.lat;
          this.longitude = knownCoord.lng;
        }
      }

      this.buildDestinationsOnMap();

    } catch (error) {
      console.error('Fetch error:', error);
      this.errorMessage = 'Kon liveboard niet laden voor ' + this.selectedStation;
      this.rows = [];
      this.destinationsOnMap = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // Build direct destinations from the live data
  private buildDestinationsOnMap(): void {
    if (!this.rows.length) {
      this.destinationsOnMap = [];
      return;
    }

    const uniqueDestMap: Record<string, LiveboardDestinationOnMap> = {};

    for (const row of this.rows) {
      const destName = row.directionName;
      if (!destName) continue;
      const key = destName.toLowerCase();
      if (uniqueDestMap[key]) continue;

      const coords = this.stationCoordinatesService.getCoordinates(destName);
      if (coords) {
        let timeStr = '';
        const depDate = new Date(row.departureTime);
        if (!isNaN(depDate.getTime())) {
          const h = String(depDate.getHours()).padStart(2, '0');
          const m = String(depDate.getMinutes()).padStart(2, '0');
          timeStr = `${h}:${m}`;
        } else {
          timeStr = String(row.departureTime || '');
        }

        uniqueDestMap[key] = {
          name: destName,
          lat: coords.lat,
          lng: coords.lng,
          trainInfo: row.vehicleInfoShortname || 'Trein',
          departureTime: timeStr,
          delayMinutes: row.delayMinutes || 0,
          platform: row.platform || '',
          statusText: row.displayStatus || ''
        };
      }
    }

    this.destinationsOnMap = Object.values(uniqueDestMap);
  }

  // Select station from autocomplete
  selectStation(station: StationDto | string): void {
    const name = typeof station === 'string' ? station : station.name;
    if (!name || name === this.selectedStation) return;

    this.selectedStation = name;
    localStorage.setItem('lastStation', name);
    this.highlightedDestination = null;
    this.fetchData();
  }

  // Row click: highlight destination on map
  onRowClick(row: LiveboardRow): void {
    const destName = row.directionName;
    if (!destName) return;

    this.highlightedDestination = destName;
    if (this.mapComponent) {
      this.mapComponent.focusDestination(destName);
    }
  }

  // Map destination click
  onDestinationFromMap(destName: string): void {
    this.highlightedDestination = destName;
  }

  // Check if a destination has coordinates on the map
  hasMapLocation(directionName: string): boolean {
    return !!this.stationCoordinatesService.getCoordinates(directionName);
  }

  // Mobile navigation between List and Map
  setMobileView(view: 'list' | 'map'): void {
    this.mobileView = view;
    if (view === 'map') {
      setTimeout(() => {
        if (this.mapComponent) {
          this.mapComponent.resize();
          if (this.highlightedDestination) {
            this.mapComponent.focusDestination(this.highlightedDestination);
          } else {
            this.mapComponent.fitMapBounds();
          }
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.fetchTimer) clearInterval(this.fetchTimer);
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.colonTimer) clearInterval(this.colonTimer);
    if (this.viaToggleTimer) clearInterval(this.viaToggleTimer);
  }
}

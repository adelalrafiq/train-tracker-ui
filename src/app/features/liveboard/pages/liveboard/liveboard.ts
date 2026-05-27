import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { Autocomplete } from '../../../../shared/components/autocomplete/autocomplete';
import { CommonModule } from '@angular/common';
import { Map } from '../../components/map/map';
import { LiveboardService } from '../../services/liveboardService';
import { LiveboardRow, StationDto } from '../../models/liveboardModel';


@Component({
  selector: 'app-liveboard',
  imports: [CommonModule, Autocomplete, Map],
  templateUrl: './liveboard.html',
  styleUrl: './liveboard.css',
})
export class Liveboard implements OnInit, OnDestroy {

  currentTime = new Date();
  selectedStation: string | null = null;  
  rows: LiveboardRow[] = [];
  latitude: number | null = null;
  longitude: number | null = null;
  errorMessage: string | null = null;
  loading = false;
  isSmallScreen = false;
  showColon = true;
  isSecondPartVisible: boolean[] = [];
  private fetchTimer!: any;
  private clockTimer!: any;
  private colonTimer!: any;

  private viaToggleTimer: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private liveboardService: LiveboardService
  ) { }

  ngOnInit() {
    const savedStation = localStorage.getItem('lastStation') || 'sint-niklaas';
    this.selectedStation = savedStation;
    
    // refresh data
    this.fetchData();
    this.fetchTimer = setInterval(() => {
      this.fetchData();
    }, 30000);

    // current clock
    this.clockTimer = setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
    if (savedStation) {
      this.selectedStation = savedStation;
    }

    // blinking colon
    this.colonTimer = setInterval(() => {

      this.showColon = !this.showColon;

      this.cdr.markForCheck();

    }, 1000);

    // via text toggle
    this.viaToggleTimer = setInterval(() => {
      this.isSecondPartVisible = this.rows.map(() => false);
      this.rows.forEach((_, index) => {
        setTimeout(() => {
          this.isSecondPartVisible[index] =
            !this.isSecondPartVisible[index];
        }, index * 80);
      });
    }, 3000);
  }


  //
  getFirstPart(stops: any[]): string {
    return stops.slice(0, 2).map(stop => stop.station).join(', ');
  }

  getSecondPart(stops: any[]): string {
    return stops.slice(2).map(stop => stop.station).join(', ');
  }

  // Fetch data
  async fetchData(): Promise<void> {
    if (!this.selectedStation) {
      return;
    }
    this.loading = true;
    this.errorMessage = null;

    try {
      const data = await this.liveboardService.getLiveboard(this.selectedStation);

      this.rows = data?.rows.map((r: any) => ({
        ...r,
        departureTime: new Date(r.departureTime)
      }));
      this.latitude = data.latitude;
      this.longitude = data.longitude;

    } catch (error) {
      console.error("Fetch error:", error);
      this.errorMessage = "Failed to load data";
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // Select station
  selectStation(station: StationDto | string): void {
    const name = typeof station === 'string' ? station : station.name;
    this.selectedStation = name;
    localStorage.setItem('lastStation', name);
    this.fetchData();
  }

  // Cleanup
  ngOnDestroy(): void {
    clearInterval(this.fetchTimer);
    clearInterval(this.clockTimer);
    clearInterval(this.colonTimer);
    clearInterval(this.viaToggleTimer);
  }
}


import {
  AfterViewInit,
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef
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
export class Liveboard implements OnInit, AfterViewInit, OnDestroy {

  currentTime = new Date();
  selectedStation: string | null = null;
  stationName = '';
  rows: LiveboardRow[] = [];
  latitude: number | null = null;
  longitude: number | null = null;
  errorMessage: string | null = null;
  loading = false;
  isSmallScreen = false;
  showColon = true;
  overflowMap: boolean[] = [];
  isSecondPartVisible: boolean[] = [];
  private fetchTimer!: any;

  private clockTimer!: any;

  private colonTimer!: any;

  @ViewChildren('viaContainer')
  viaContainers!: QueryList<ElementRef>;

  @ViewChildren('viaText')
  viaTexts!: QueryList<ElementRef>;

  constructor(
    private cdr: ChangeDetectorRef,
    private liveboardService: LiveboardService
  ) { }

  ngOnInit() {
    const savedStation = localStorage.getItem('lastStation') || 'sint-niklaas';
    this.selectedStation = savedStation;

    this.checkScreen();

    this.fetchData();

    // refresh data
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

    // responsive
    window.addEventListener('resize', () => {
      this.checkScreen();
    });

    // via text toggle
    this.isSecondPartVisible = this.rows.map(() => false);
    setInterval(() => {
      this.rows.forEach((_, index) => {

        // stagger effect (makes it look like train board UI)
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

  // After view init
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.calculateOverflow();
    });
  }

  // Overflow
  calculateOverflow(): void {
    this.overflowMap = [];
    this.viaContainers.forEach((containerRef, index) => {
      const containerWidth = containerRef.nativeElement.offsetWidth;
      const textWidth = this.viaTexts.get(index)?.nativeElement.scrollWidth || 0;
      this.overflowMap[index] = textWidth > containerWidth;
    });
    this.cdr.markForCheck();
  }

  // Screen size
  checkScreen() {
    this.isSmallScreen = window.innerWidth < 768;
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

      // recalc overflow
      setTimeout(() => {
        this.calculateOverflow();
      });

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
  }

  // Status class
  getStatusClass(status: string): string {
    switch (status) {
      case 'geannuleerd':
        return 'text-red-500 font-semibold';
      case 'aan perron':
      case 'komt aan':
        return 'text-white font-semibold';
      default:
        return '';
    }
  }
}


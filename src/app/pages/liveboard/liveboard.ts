import {
  AfterViewInit,
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Map } from '../map/map';
import { LiveboardService } from '../../services/liveboardService';
import { LiveboardRow, StationDto } from '../../models/liveboardModel';

@Component({
  selector: 'app-liveboard',
  imports: [CommonModule, FormsModule, Map],
  templateUrl: './liveboard.html',
  styleUrl: './liveboard.css',
})
export class Liveboard implements OnInit, AfterViewInit, OnDestroy {
  suggestions: StationDto[] = [];
  showDropdown = false;
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

  // Search
  async onInputChange(value: string): Promise<void> {
    this.stationName = value;

    if (value.length < 1) {
      this.suggestions = [];
      this.showDropdown = false;
      return;
    }

    try {
      const result = await this.liveboardService.searchStations(value);
      this.suggestions = result;
      this.showDropdown = true;

    } catch (err) {
      console.error(err);
      this.suggestions = [];
      this.showDropdown = false;
    }

    this.cdr.markForCheck();
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
  selectStation(station: StationDto): void {
    this.selectedStation = station.name;
    this.stationName = '';
    this.showDropdown = false;
    localStorage.setItem('lastStation', station.name);
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


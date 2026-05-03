import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy
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
export class Liveboard implements OnInit, OnDestroy {
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
  private timer!: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private liveboardService: LiveboardService
  ) { }

  ngOnInit() {
    const savedStation = localStorage.getItem('lastStation') || 'sint-niklaas';
    this.checkScreen();

    if (savedStation) {
      this.selectedStation = savedStation;
    }
    this.fetchData();
    window.addEventListener('resize', () => {
      this.checkScreen();
    });
    // setInterval(() => {
    //   this.currentTime = new Date();
    //   if (this.isSmallScreen) {
    //     this.showColon = !this.showColon;
    //   } else {
    //     this.showColon = true;
    //   }
    //   this.cdr.markForCheck();
    // }, 1000);

    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);

    // وميض النقطتين كل ثانية
    setInterval(() => {
      this.showColon = !this.showColon;
      this.cdr.markForCheck();
    }, 1000);

    this.timer = setInterval(() => {
      this.fetchData();
    }, 30000);
  }

  checkScreen() {
    this.isSmallScreen = window.innerWidth < 768;
  }
  async onInputChange(value: string) {
    this.stationName = value;

    if (value.length < 1) {
      this.suggestions = [];
      this.showDropdown = false;
      return;
    }

    try {
      const result = await this.liveboardService.searchStations(value);

      console.log("Suggestions:", result);

      this.suggestions = result;
      this.showDropdown = true;

    } catch (err) {
      console.error(err);
      this.suggestions = [];
      this.showDropdown = false;
    }

    this.cdr.markForCheck();
  }
  async fetchData() {
    if (!this.selectedStation) {
      console.warn("No station selected");
      return;
    }
    this.loading = true;
    this.errorMessage = null;

    try {
      console.log("Fetching for:", this.selectedStation);
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
  selectStation(station: any) {
    this.selectedStation = station.name;
    console.log("Selected:", this.selectedStation);

    this.stationName = '';
    this.showDropdown = false;
    localStorage.setItem('lastStation', station.name);
    setTimeout(() => {
      this.fetchData();
    });
  }
  ngOnDestroy() {
    clearInterval(this.timer);
  }
}


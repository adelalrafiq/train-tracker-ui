import {
  AfterViewInit,
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Autocomplete } from '../../../../shared/components/autocomplete/autocomplete';
import { CommonModule } from '@angular/common';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { Observable } from 'rxjs';
// import { map, startWith } from 'rxjs/operators';
import { Map } from '../../components/map/map';
import { LiveboardService } from '../../services/liveboardService';
import { LiveboardRow, StationDto } from '../../models/liveboardModel';
// import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';
// import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-liveboard',
  imports: [CommonModule, Autocomplete, Map],
  templateUrl: './liveboard.html',
  styleUrl: './liveboard.css',
})
export class Liveboard implements OnInit, AfterViewInit, OnDestroy {
  // myControl = new FormControl<string | StationDto>('');
  // filteredOptions!: Observable<StationDto[]>;
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
  // @ViewChild(MatAutocompleteTrigger)
  // autocomplete!: MatAutocompleteTrigger;
  constructor(
    private cdr: ChangeDetectorRef,
    private liveboardService: LiveboardService
  ) { }

  ngOnInit() {
    const savedStation = localStorage.getItem('lastStation') || 'sint-niklaas';
    this.selectedStation = savedStation;
    // this.filteredOptions = this.myControl.valueChanges.pipe(
    //   startWith(''),
    //   map(value => typeof value === 'string' ? value : value?.name || ''),
    //   switchMap(value => this.searchStations(value))
    // );
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

  // handleAutocompleteKeydown(event: KeyboardEvent): void {

  //   if (event.key !== 'Tab') {
  //     return;
  //   }

  //   if (!this.autocomplete.activeOption) {
  //     return;
  //   }

  //   event.preventDefault();

  //   const selected =
  //     this.autocomplete.activeOption.value;

  //   this.selectStation(selected);
  // }

  // searchStations(value: string): Observable<StationDto[]> {

  //   if (!value || value.length < 1) {
  //     return of([]);
  //   }

  //   return new Observable(observer => {

  //     this.liveboardService.searchStations(value)
  //       .then(result => {
  //         observer.next(result);
  //         observer.complete();
  //       })
  //       .catch(() => {
  //         observer.next([]);
  //         observer.complete();
  //       });

  //   });
  // }

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
    // this.myControl.setValue('');
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


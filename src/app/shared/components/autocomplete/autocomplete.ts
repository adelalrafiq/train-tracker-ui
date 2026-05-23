import {
  Component, EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { StationDto } from '../../models/stationModel';
import { StationService } from '../../services/station-service';
@Component({
  selector: 'app-autocomplete',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './autocomplete.html',
  styleUrl: './autocomplete.css',
})
export class Autocomplete {
  @Input() placeholder = 'Zoek een station...';
  @Input() label?: string;
  @Input() icon?: string;
  @Input() initialValue = '';
  @Output() stationSelected = new EventEmitter<string>();

  control = new FormControl<string | StationDto>('');
  filteredOptions!: Observable<StationDto[]>;

  @ViewChild(MatAutocompleteTrigger)
  autocomplete!: MatAutocompleteTrigger;

  constructor(
    private stationService: StationService
  ) { }
  ngOnInit(): void {
    if (this.initialValue) {
      this.control.setValue(this.initialValue);
    }
    this.filteredOptions = this.control.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.name || ''),
      switchMap(value => this.searchStations(value))
    );
  }

  searchStations(value: string): Observable<StationDto[]> {

    if (!value || value.length < 1) {
      return of([]);
    }

    return new Observable(observer => {

      this.stationService.searchStations(value)
        .then(result => {
          observer.next(result);
          observer.complete();
        })
        .catch(() => {
          observer.next([]);
          observer.complete();
        });
    });
  }

  // Select station
  selectStation(station: StationDto | string): void {
    const name = typeof station === 'string' ? station : station.name;
    this.stationSelected.emit(name);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StationDto } from '../models/stationModel';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StationService {
  private stationsUrl = environment.api.baseUrl + environment.api.stations;
  constructor(private http: HttpClient) { }
   async searchStations(query: string): Promise<StationDto[]> {
      return firstValueFrom(
        this.http.get<StationDto[]>(
          `${this.stationsUrl}?query=${query}`
        )
      )
    }
}

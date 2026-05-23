import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { LiveboardResponse, StationDto } from '../models/liveboardModel';

@Injectable({
  providedIn: 'root',
})
export class LiveboardService {

  private baseUrl = environment.api.baseUrl + environment.api.liveboard;
  private stationsUrl = environment.api.baseUrl + environment.api.stations;

  constructor(private http: HttpClient) { }

  async getLiveboard(station: string): Promise<LiveboardResponse> {

    return firstValueFrom(
      this.http.get<LiveboardResponse>(`${this.baseUrl}/${station}`)
    );
  }

  async searchStations(query: string): Promise<StationDto[]> {
    return firstValueFrom(
      this.http.get<StationDto[]>(
        `${this.stationsUrl}?query=${query}`)
    );
  }
}

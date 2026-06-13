import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConnectionDto } from '../models/connectionsModel';
import { StationDto } from '../../liveboard/models/liveboardModel';

@Injectable({
  providedIn: 'root',
})
export class ConnectionsService {

  private baseUrl = environment.api.baseUrl + environment.api.connections;
  private readonly _connections$ = new BehaviorSubject<ConnectionDto[]>([]);
  readonly connections$ = this._connections$.asObservable();
  private _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();
  private stationsUrl = environment.api.baseUrl + environment.api.stations;
  constructor(private http: HttpClient) { }

  searchConnections(from: string, to: string): void {

    this._loading$.next(true);

    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    this.http.get<ConnectionDto[]>(
      this.baseUrl, { params })
      .subscribe({
        next: (data) => {        
          this._connections$.next(data);
          this._loading$.next(false);
        },
        error: (err) => {
          console.error(err);
          this._connections$.next([]);
          this._loading$.next(false);
        }
      });
  }

  async searchStations(query: string): Promise<StationDto[]> {
    return firstValueFrom(
      this.http.get<StationDto[]>(
        `${this.stationsUrl}?query=${query}`
      )
    )
  }

  get connectionsValue(): ConnectionDto[] {
    return this._connections$.value;
  }
}

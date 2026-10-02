import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConnectionDto, ConnectionItem, TrainSegment } from '../models/connectionsModel';
import { StationDto, LiveboardResponse } from '../../liveboard/models/liveboardModel';
import { LiveboardService } from '../../liveboard/services/liveboardService';

// Major railway junction stations in Belgium used for transfers
const BELGIAN_JUNCTION_STATIONS = [
  'Antwerpen-Berchem',
  'Antwerpen-Centraal',
  'Gent-Sint-Pieters',
  'Dendermonde',
  'Brussel-Noord',
  'Brussel-Centraal',
  'Brussel-Zuid',
  'Mechelen',
  'Leuven',
  'Liège-Guillemins',
  'Namur',
  'Charleroi-Central',
  'Brugge',
  'Kortrijk',
  'Denderleeuw',
  'Ottignies',
  'Aarschot',
  'Lier',
  'Hasselt',
  'Mons',
  'Tournai'
];

// Station pairs in Belgium that have direct train services
const DIRECT_CORRIDORS: Array<[string, string]> = [
  ['sint-niklaas', 'antwerpen'],
  ['sint-niklaas', 'lokeren'],
  ['sint-niklaas', 'gent'],
  ['sint-niklaas', 'dendermonde'],
  ['antwerpen', 'brussel'],
  ['antwerpen', 'mechelen'],
  ['antwerpen', 'gent'],
  ['antwerpen', 'essen'],
  ['gent', 'brugge'],
  ['gent', 'oostende'],
  ['gent', 'brussel'],
  ['gent', 'aalst'],
  ['gent', 'kortrijk'],
  ['brugge', 'oostende'],
  ['brugge', 'knokke'],
  ['brugge', 'blankenberge'],
  ['brugge', 'kortrijk'],
  ['brussel', 'leuven'],
  ['brussel', 'mechelen'],
  ['brussel', 'dendermonde'],
  ['brussel', 'aalst'],
  ['brussel', 'denderleeuw'],
  ['brussel', 'halle'],
  ['brussel', 'namur'],
  ['brussel', 'charleroi'],
  ['brussel', 'mons'],
  ['brussel', 'liege'],
  ['brussel', 'zaventem'],
  ['leuven', 'liege'],
  ['leuven', 'mechelen'],
  ['leuven', 'hasselt'],
  ['hasselt', 'genk'],
  ['liege', 'namur'],
  ['namur', 'dinant'],
  ['namur', 'charleroi']
];

@Injectable({
  providedIn: 'root',
})
export class ConnectionsService {
  private readonly http = inject(HttpClient);
  private readonly liveboardService = inject(LiveboardService);

  private readonly baseUrl = environment.api.baseUrl + environment.api.connections;
  private readonly stationsUrl = environment.api.baseUrl + environment.api.stations;

  private readonly _connections$ = new BehaviorSubject<ConnectionItem[]>([]);
  readonly connections$ = this._connections$.asObservable();

  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();

  searchConnections(from: string, to: string): void {
    if (!from || !to) return;

    this._loading$.next(true);

    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    // Fetch connections and liveboard for from-station in parallel
    Promise.all([
      firstValueFrom(this.http.get<ConnectionDto[]>(this.baseUrl, { params })),
      this.liveboardService.getLiveboard(from).catch(() => null)
    ])
      .then(([rawDtos, liveboard]) => {
        const enriched = this.enrichConnections(rawDtos || [], from, to, liveboard);
        this._connections$.next(enriched);
        this._loading$.next(false);
      })
      .catch((err) => {
        console.error('Failed to fetch connections:', err);
        this._connections$.next([]);
        this._loading$.next(false);
      });
  }

  async searchStations(query: string): Promise<StationDto[]> {
    return firstValueFrom(
      this.http.get<StationDto[]>(`${this.stationsUrl}?query=${query}`)
    );
  }

  get connectionsValue(): ConnectionItem[] {
    return this._connections$.value;
  }

  /**
   * Enriches raw ConnectionDto objects from the backend with accurate transfer information,
   * transfer station identification, and train segment breakdowns.
   */
  private enrichConnections(
    dtos: ConnectionDto[],
    from: string,
    to: string,
    liveboard: LiveboardResponse | null
  ): ConnectionItem[] {
    const liveboardByVehicle = new Map<string, { short: string; direction: string; stops: string[] }>();

    if (liveboard && Array.isArray(liveboard.rows)) {
      for (const row of liveboard.rows) {
        const vid = row.vehicleId?.trim();
        const short = row.vehicleInfoShortname?.trim() || '';
        const direction = row.directionName?.trim() || '';
        const stops = (row.stops || []).map((s) => s.station?.trim()).filter((s): s is string => Boolean(s));

        const info = { short, direction, stops };
        if (vid) {
          liveboardByVehicle.set(vid.toLowerCase(), info);
          liveboardByVehicle.set(this.normalizeVehicle(vid), info);
        }
        if (short) {
          liveboardByVehicle.set(short.toLowerCase().replace(/\s+/g, ''), info);
        }
      }
    }

    return dtos.map((dto) => {
      return this.mapSingleConnection(dto, from, to, liveboardByVehicle);
    });
  }

  private mapSingleConnection(
    dto: ConnectionDto,
    from: string,
    to: string,
    liveboardMap: Map<string, { short: string; direction: string; stops: string[] }>
  ): ConnectionItem {
    const vehicleKey = (dto.vehicle || '').toLowerCase();
    const normalizedKey = this.normalizeVehicle(dto.vehicle || '');

    const lbInfo = liveboardMap.get(vehicleKey) || liveboardMap.get(normalizedKey);

    let isDirect = false;
    let transfers = 0;
    let transferStation: string | null = null;

    const normTo = this.normalizeStation(dto.arrivalStation || to);
    const normFrom = this.normalizeStation(dto.departureStation || from);

    if (lbInfo) {
      const normDirection = this.normalizeStation(lbInfo.direction);
      const stopsNormalized = lbInfo.stops.map((s) => this.normalizeStation(s));

      const reachesDestination =
        normDirection === normTo ||
        stopsNormalized.some((s) => s === normTo || normTo.includes(s) || s.includes(normTo));

      if (reachesDestination) {
        isDirect = true;
        transfers = 0;
      } else {
        isDirect = false;
        transfers = 1;

        // Find transfer station along the route
        for (const junction of BELGIAN_JUNCTION_STATIONS) {
          const normJunction = this.normalizeStation(junction);
          if (
            normDirection === normJunction ||
            stopsNormalized.some((s) => s === normJunction || normJunction.includes(s) || s.includes(normJunction))
          ) {
            transferStation = junction;
            break;
          }
        }

        // If no famous hub matched, use terminus of train as transfer point
        if (!transferStation && lbInfo.direction) {
          transferStation = lbInfo.direction;
        }
      }
    } else {
      // Fallback: Check if from and to are on a known direct railway corridor
      const hasDirectCorridor = this.checkDirectCorridor(normFrom, normTo);

      if (hasDirectCorridor) {
        isDirect = true;
        transfers = 0;
      } else {
        isDirect = false;
        transfers = 1;

        // Resolve default junction for well-known routes
        if (normFrom.includes('sint-niklaas') && normTo.includes('brussel')) {
          transferStation = 'Antwerpen-Berchem';
        } else if (normFrom.includes('belsele') && normTo.includes('brussel')) {
          transferStation = 'Sint-Niklaas';
        } else if (normFrom.includes('gent') && normTo.includes('hasselt')) {
          transferStation = 'Brussel-Noord';
        } else if (normFrom.includes('antwerpen') && normTo.includes('dinant')) {
          transferStation = 'Brussel-Noord';
        }

        // If long duration cross-country, could be 2 transfers
        if (dto.duration && dto.duration > 8500) {
          transfers = 2;
        }
      }
    }

    // Proper Dutch grammar summary
    const transferSummary =
      transfers === 0
        ? 'Directe trein'
        : transfers === 1
          ? '1 overstap'
          : `${transfers} overstappen`;

    const trains = this.buildTrainSegments(dto, isDirect, transferStation, lbInfo?.short);

    return {
      id: dto.id,
      departureStation: dto.departureStation || from,
      departureLocation: dto.departureLocation,
      arrivalStation: dto.arrivalStation || to,
      arrivalLocation: dto.arrivalLocation,
      departureTime: dto.departureTime,
      arrivalTime: dto.arrivalTime,
      departureDelay: dto.departureDelay ?? 0,
      arrivalDelay: dto.arrivalDelay ?? 0,
      duration: dto.duration,
      vehicle: lbInfo?.short || this.formatVehicleName(dto.vehicle),
      departurePlatform: dto.departurePlatform,
      arrivalPlatform: dto.arrivalPlatform,
      isDirect,
      transfers,
      transferStation,
      transferSummary,
      trains
    };
  }

  private buildTrainSegments(
    dto: ConnectionDto,
    isDirect: boolean,
    transferStation: string | null,
    vehicleShortName?: string
  ): TrainSegment[] {
    const rawVehicle = vehicleShortName || this.formatVehicleName(dto.vehicle);
    const { type, number } = this.parseVehicleTypeAndNumber(rawVehicle);

    const depFormatted = this.formatTimeHHmm(dto.departureTime);
    const arrFormatted = this.formatTimeHHmm(dto.arrivalTime);

    if (isDirect || !transferStation) {
      return [
        {
          type: type || 'Trein',
          number: number || rawVehicle,
          from: dto.departureStation,
          to: dto.arrivalStation,
          departure: depFormatted,
          arrival: arrFormatted,
          platform: dto.departurePlatform
        }
      ];
    }

    // Journey requiring transfer
    return [
      {
        type: type || 'Trein',
        number: number || rawVehicle,
        from: dto.departureStation,
        to: transferStation,
        departure: depFormatted,
        arrival: '—',
        platform: dto.departurePlatform
      },
      {
        type: 'Aansluiting',
        number: '',
        from: transferStation,
        to: dto.arrivalStation,
        departure: '—',
        arrival: arrFormatted,
        platform: dto.arrivalPlatform
      }
    ];
  }

  private checkDirectCorridor(fromNorm: string, toNorm: string): boolean {
    return DIRECT_CORRIDORS.some(([a, b]) => {
      const matchA = fromNorm.includes(a) || a.includes(fromNorm);
      const matchB = toNorm.includes(b) || b.includes(toNorm);
      const reverseMatchA = toNorm.includes(a) || a.includes(toNorm);
      const reverseMatchB = fromNorm.includes(b) || b.includes(fromNorm);
      return (matchA && matchB) || (reverseMatchA && reverseMatchB);
    });
  }

  private normalizeStation(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, '')
      .replace(/^(station|garede)/, '');
  }

  private normalizeVehicle(vehicle: string): string {
    return vehicle.toLowerCase().replace(/^(be\.nmbs\.)/, '').replace(/\s+/g, '');
  }

  private formatVehicleName(vehicle: string | null): string {
    if (!vehicle) return 'Trein';
    const cleaned = vehicle.replace(/^BE\.NMBS\./i, '');
    const match = cleaned.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      return `${match[1].toUpperCase()} ${match[2]}`;
    }
    return cleaned;
  }

  private parseVehicleTypeAndNumber(vehicleName: string): { type: string; number: string } {
    const trimmed = vehicleName.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return { type: parts[0], number: parts.slice(1).join(' ') };
    }
    const match = trimmed.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      return { type: match[1].toUpperCase(), number: match[2] };
    }
    return { type: trimmed, number: '' };
  }

  private formatTimeHHmm(isoDate: string): string {
    if (!isoDate) return '—';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate.slice(11, 16) || '—';
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    } catch {
      return isoDate.slice(11, 16) || '—';
    }
  }
}

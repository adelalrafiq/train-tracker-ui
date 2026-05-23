export interface LiveboardRow {
    directionName: string;
    departureTime: string;
    displayStatus: string;
    platform: string;
    vehicleInfoShortname: string;
    delayMinutes: number;
    status: number;
    stops: StopDto[];
}

export interface LiveboardResponse {
    stationName: string;
    latitude: number;
    longitude: number;
    rows: LiveboardRow[];
}

export interface StationDto {
    name: string;
}

export interface StopDto {
    station: string;
    status: string;
}
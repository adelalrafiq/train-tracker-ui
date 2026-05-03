export interface LiveboardRow {
    directionName: string;
    departureTime: string;
    platform: string;
    vehicleInfoShortname: string;
    delayMinutes: number;
    status: number;
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
export interface StationLocation {
    lat: number;
    lng: number;
}

/**
 * Raw DTO directly returned by the TrainTracker backend API (/Connections)
 */
export interface ConnectionDto {
    id: number;
    departureStation: string;
    departureLocation: StationLocation;
    arrivalStation: string;
    arrivalLocation: StationLocation;
    departureTime: string;
    arrivalTime: string;
    departureDelay?: number;
    arrivalDelay?: number;
    duration: number;
    vehicle: string | null;
    departurePlatform: string | null;
    arrivalPlatform: string | null;
}

export interface StationCoord {
    name: string;
    lat: number;
    lng: number;
}

export interface Departure {
    id: string;
    time: string;
    delay: number;
    platform: string;
    destination: string;
    trainType: string;
    trainNumber: string;
}

export interface TrainSegment {
    type: string;
    number: string;
    from: string;
    to: string;
    departure: string;
    arrival: string;
    platform?: string | null;
}

/**
 * Enriched connection model used by the UI and map with accurate transfer detection
 */
export interface ConnectionItem {
    id: number;
    departureStation: string;
    departureLocation: StationLocation;
    arrivalStation: string;
    arrivalLocation: StationLocation;
    departureTime: string;
    arrivalTime: string;
    departureDelay: number;
    arrivalDelay: number;
    duration: number;
    vehicle: string;
    departurePlatform: string | null;
    arrivalPlatform: string | null;
    isDirect: boolean;
    transfers: number;
    transferStation: string | null;
    transferSummary: string;
    trains: TrainSegment[];
}

export interface MapMarker {
    lngLat: [number, number];
    label: string;
}

export interface MapLine {
    from: [number, number];
    to: [number, number];
}

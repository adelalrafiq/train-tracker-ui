export interface StationLocation {
    lat: number;
    lng: number;
}
export interface ConnectionDto {
    id: number;
    departureStation: string;
    departureLocation: StationLocation;
    arrivalStation: string;
    arrivalLocation: StationLocation;
    departureTime: string;
    arrivalTime: string;
    duration: number;
    vehicle: string;
    departurePlatform: string;
    arrivalPlatform: string;
    transfers: number;
    trains: any[];
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
    platform: string;
}

export interface Connection {
    id: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    transfers: number;
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
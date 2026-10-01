import { Injectable } from '@angular/core';

export interface StationLocation {
  lat: number;
  lng: number;
}

export function calculateGeographicDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatDistanceKm(distanceKm: number): string {
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

@Injectable({
  providedIn: 'root'
})
export class StationCoordinatesService {
  // Known official Belgian railway stations coordinates (WGS84)
  private readonly stationsCoordMap: Record<string, StationLocation> = {
    'antwerpen-centraal': { lat: 51.2172, lng: 4.4211 },
    'antwerpen-berchem': { lat: 51.1990, lng: 4.4326 },
    'antwerpen-zuid': { lat: 51.1904, lng: 4.3912 },
    'antwerpen-luchtbal': { lat: 51.2547, lng: 4.4269 },
    'brussel-zuid': { lat: 50.8357, lng: 4.3365 },
    'bruxelles-midi': { lat: 50.8357, lng: 4.3365 },
    'brussel-centraal': { lat: 50.8456, lng: 4.3567 },
    'bruxelles-central': { lat: 50.8456, lng: 4.3567 },
    'brussel-noord': { lat: 50.8596, lng: 4.3608 },
    'bruxelles-nord': { lat: 50.8596, lng: 4.3608 },
    'brussel-schuman': { lat: 50.8436, lng: 4.3833 },
    'brussel-luxemburg': { lat: 50.8389, lng: 4.3739 },
    'brussels airport - zaventem': { lat: 50.9014, lng: 4.4844 },
    'brussels airport-zaventem': { lat: 50.9014, lng: 4.4844 },
    'gent-sint-pieters': { lat: 51.0359, lng: 3.7107 },
    'gent-dampoort': { lat: 51.0560, lng: 3.7431 },
    'gentbrugge': { lat: 51.0414, lng: 3.7608 },
    'sint-niklaas': { lat: 51.1715, lng: 4.1430 },
    'lokeren': { lat: 51.1039, lng: 3.9936 },
    'dendermonde': { lat: 51.0267, lng: 4.1017 },
    'brugge': { lat: 51.1972, lng: 3.2167 },
    'oostende': { lat: 51.2294, lng: 2.9286 },
    'kortrijk': { lat: 50.8242, lng: 3.2644 },
    'de panne': { lat: 51.0772, lng: 2.6019 },
    'poperinge': { lat: 50.8550, lng: 2.7303 },
    'leuven': { lat: 50.8823, lng: 4.7153 },
    'mechelen': { lat: 51.0179, lng: 4.4828 },
    'mechelen-nekkerspoel': { lat: 51.0294, lng: 4.4936 },
    'hasselt': { lat: 50.9322, lng: 5.3283 },
    'genk': { lat: 50.9669, lng: 5.5039 },
    'liege-guillemins': { lat: 50.6244, lng: 5.5667 },
    'liège-guillemins': { lat: 50.6244, lng: 5.5667 },
    'namur': { lat: 50.4697, lng: 4.8622 },
    'namen': { lat: 50.4697, lng: 4.8622 },
    'charleroi-central': { lat: 50.4047, lng: 4.4389 },
    'mons': { lat: 50.4542, lng: 3.9431 },
    'bergen': { lat: 50.4542, lng: 3.9431 },
    'tournai': { lat: 50.6133, lng: 3.3969 },
    'doornik': { lat: 50.6133, lng: 3.3969 },
    'aalst': { lat: 50.9425, lng: 4.0392 },
    'beveren': { lat: 51.2133, lng: 4.2575 },
    'belsele': { lat: 51.1461, lng: 4.0931 },
    'sinaai': { lat: 51.1442, lng: 4.0417 },
    'nieuwkerken-waas': { lat: 51.1942, lng: 4.1794 },
    'melsele': { lat: 51.2158, lng: 4.2831 },
    'temse': { lat: 51.1306, lng: 4.2094 },
    'bornem': { lat: 51.0964, lng: 4.2344 },
    'puurs': { lat: 51.0767, lng: 4.2764 },
    'zottegem': { lat: 50.8697, lng: 3.8114 },
    'oudenaarde': { lat: 50.8497, lng: 3.6025 },
    'ieper': { lat: 50.8528, lng: 2.8778 },
    'roeselare': { lat: 50.9458, lng: 3.1297 },
    'waregem': { lat: 50.8872, lng: 3.4289 },
    'tienen': { lat: 50.8039, lng: 4.9422 },
    'landen': { lat: 50.7539, lng: 5.0789 },
    'aarschot': { lat: 50.9858, lng: 4.8236 },
    'diest': { lat: 50.9942, lng: 5.0567 },
    'mol': { lat: 51.1917, lng: 5.1167 },
    'geel': { lat: 51.1672, lng: 4.9922 },
    'turnhout': { lat: 51.3289, lng: 4.9406 },
    'lier': { lat: 51.1333, lng: 4.5683 },
    'herentals': { lat: 51.1811, lng: 4.8322 },
    'vilvoorde': { lat: 50.9272, lng: 4.4339 },
    'halle': { lat: 50.7336, lng: 4.2392 },
    'ottignies': { lat: 50.6728, lng: 4.5681 },
    'louvain-la-neuve': { lat: 50.6694, lng: 4.6156 },
    'nivelles': { lat: 50.5936, lng: 4.3314 },
    'ath': { lat: 50.6331, lng: 3.7744 },
    'verviers-central': { lat: 50.5897, lng: 5.8542 },
    'eupen': { lat: 50.6339, lng: 6.0381 },
    'welkenraedt': { lat: 50.6617, lng: 5.9722 },
    'huy': { lat: 50.5217, lng: 5.2358 },
    'ciney': { lat: 50.2936, lng: 5.1017 },
    'marloie': { lat: 50.2014, lng: 5.3164 },
    'libramont': { lat: 49.9197, lng: 5.3789 },
    'arlon': { lat: 49.6806, lng: 5.8111 },
    'dinant': { lat: 50.2608, lng: 4.9122 },
    'denderleeuw': { lat: 50.8872, lng: 4.0767 },
    'ninove': { lat: 50.8358, lng: 4.0264 },
    'geraardsbergen': { lat: 50.7717, lng: 3.8767 },
    'ronse': { lat: 50.7511, lng: 3.6025 },
    'knokke': { lat: 51.3392, lng: 3.2844 },
    'blankenberge': { lat: 51.3128, lng: 3.1331 },
    'veurne': { lat: 51.0711, lng: 2.6681 },
    'diksmuide': { lat: 51.0333, lng: 2.8689 },
    'deinze': { lat: 50.9833, lng: 3.5306 },
    'eeklo': { lat: 51.1856, lng: 3.5672 },
    'aalter': { lat: 51.0858, lng: 3.4475 },
    'wetteren': { lat: 51.0028, lng: 3.8864 },
    'heist-op-den-berg': { lat: 51.0789, lng: 4.7178 },
    'boom': { lat: 51.0861, lng: 4.3722 },
    'willebroek': { lat: 51.0578, lng: 4.3639 },
    'zaventem': { lat: 50.8814, lng: 4.4756 },
    'kortenberg': { lat: 50.8864, lng: 4.5889 },
    'herent': { lat: 50.9061, lng: 4.6739 },
    'hove': { lat: 51.1558, lng: 4.4714 },
    'kontich-lint': { lat: 51.1331, lng: 4.4750 },
    'duffel': { lat: 51.0967, lng: 4.5028 },
    'sint-katelijne-waver': { lat: 51.0667, lng: 4.5039 }
  };

  private dynamicCache: Record<string, StationLocation> = {};
  private stationIdCache: Record<string, StationLocation> = {};

  normalizeStationName(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^(gare de |station )/i, '');
  }

  /**
   * Resolves coordinates in order of authority:
   * 1. Direct station ID in cache (trusted API response with stable identifier)
   * 2. Station name in dynamicCache (trusted API response)
   * 3. Verified Belgian station coordinates dataset
   * 4. Null if unavailable (do NOT place fake or ambiguous markers)
   */
  getCoordinates(stationNameOrId: string, stationId?: string): StationLocation | null {
    if (stationId) {
      const normalizedId = stationId.trim().toLowerCase();
      if (this.stationIdCache[normalizedId]) {
        return this.stationIdCache[normalizedId];
      }
    }

    if (!stationNameOrId) return null;
    const normalized = this.normalizeStationName(stationNameOrId);

    if (this.stationIdCache[normalized]) {
      return this.stationIdCache[normalized];
    }

    if (this.dynamicCache[normalized]) {
      return this.dynamicCache[normalized];
    }

    if (this.stationsCoordMap[normalized]) {
      return this.stationsCoordMap[normalized];
    }

    // Handle bilingual slashes e.g. "Brussel-Zuid / Bruxelles-Midi"
    if (normalized.includes('/')) {
      const parts = normalized.split('/').map(p => p.trim());
      for (const part of parts) {
        if (this.stationsCoordMap[part]) return this.stationsCoordMap[part];
        if (this.dynamicCache[part]) return this.dynamicCache[part];
      }
    }

    return null;
  }

  /**
   * Store trusted coordinates from an API response with validation.
   * Rejects out-of-range coordinates or NaN to avoid caching ambiguous/corrupted locations.
   */
  setCoordinates(stationName: string, lat: number, lng: number, stationId?: string): void {
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return;
    // Validate reasonable geographic boundaries (Belgium & neighboring transit area)
    if (lat < 49.0 || lat > 53.0 || lng < 2.0 || lng > 7.5) return;

    const loc: StationLocation = { lat, lng };

    if (stationId && stationId.trim()) {
      this.stationIdCache[stationId.trim().toLowerCase()] = loc;
    }

    if (stationName && stationName.trim()) {
      const normalized = this.normalizeStationName(stationName);
      this.dynamicCache[normalized] = loc;
    }
  }
}

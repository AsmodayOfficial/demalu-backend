import { Decimal } from '@prisma/client/runtime/library';

export class GeoUtils {
  /**
   * Calculates distance in Kilometers between two points using the Haversine formula.
   * Accepts standard JavaScript numbers or Prisma Decimals.
   */
  static getDistanceInKm(
    lat1: number | Decimal,
    lon1: number | Decimal,
    lat2: number | Decimal,
    lon2: number | Decimal,
  ): number {
    // Convert Decimals to standard JS numbers if necessary
    const rLat1 = typeof lat1 === 'object' ? Number(lat1) : lat1;
    const rLon1 = typeof lon1 === 'object' ? Number(lon1) : lon1;
    const rLat2 = typeof lat2 === 'object' ? Number(lat2) : lat2;
    const rLon2 = typeof lon2 === 'object' ? Number(lon2) : lon2;

    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(rLat2 - rLat1);
    const dLon = this.deg2rad(rLon2 - rLon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(rLat1)) *
        Math.cos(this.deg2rad(rLat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
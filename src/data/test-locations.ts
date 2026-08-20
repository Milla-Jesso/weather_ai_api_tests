/**
 * Shared location fixtures so tests reference named, meaningful
 * coordinates instead of magic numbers scattered across files.
 */
export const locations = {
  nairobi: { lat: -1.286389, lon: 36.817223 },
  newYork: { lat: 40.7128, lon: -74.006 },
  london: { lat: 51.5074, lon: -0.1278 },

  // Edge cases worth covering explicitly
  equatorPrimeMeridian: { lat: 0, lon: 0 },
  northPole: { lat: 90, lon: 0 },
  southPole: { lat: -90, lon: 0 },
  antimeridian: { lat: 0, lon: 179.999 },

  // Invalid on purpose — used by negative tests
  outOfRangeLat: { lat: 200, lon: 36.82 },
  outOfRangeLon: { lat: -1.29, lon: 500 },
  nonNumeric: { lat: 'abc', lon: 'xyz' },
} as const;

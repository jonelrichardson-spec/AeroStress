/**
 * IEC 61400-1 stress multiplier logic (mirrors backend app/utils/calculators.py).
 * Maps terrain class to stress multiplier; computes True Age = Calendar Age × multiplier.
 */

/** @type {Record<string, number>} */
export const TERRAIN_MULTIPLIERS = {
  flat: 1.0,
  moderate: 1.2,
  complex: 1.5,
  coastal: 1.35,
};

/**
 * @param {string} terrainClass - 'flat' | 'moderate' | 'complex' | 'coastal'
 * @returns {number}
 */
export function getStressMultiplier(terrainClass) {
  return TERRAIN_MULTIPLIERS[terrainClass] ?? 1.0;
}

/**
 * True Age = Calendar Age × Terrain Stress Multiplier (IEC 61400-1).
 * @param {number} calendarAgeYears
 * @param {string} terrainClass
 * @returns {{ multiplier: number, trueAgeYears: number }}
 */
export function computeTrueAge(calendarAgeYears, terrainClass) {
  const multiplier = getStressMultiplier(terrainClass);
  const trueAgeYears = Math.round(calendarAgeYears * multiplier * 100) / 100;
  return { multiplier, trueAgeYears };
}

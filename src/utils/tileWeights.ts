export const MIN_TILE_WEIGHT = 0
export const MAX_TILE_WEIGHT = 100
export const DEFAULT_TILE_WEIGHT = 1

export const normalizeTileWeight = (weight: number | null | undefined) => {
  if (typeof weight !== 'number' || !Number.isFinite(weight)) {
    return DEFAULT_TILE_WEIGHT
  }

  return Math.min(MAX_TILE_WEIGHT, Math.max(MIN_TILE_WEIGHT, Math.round(weight)))
}

import type { PreviewMode, Tile, TileImageAsset } from '../types/projectTypes'

export const SUPPORTED_TILE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const isSupportedTileImageType = (mimeType: string) =>
  SUPPORTED_TILE_IMAGE_TYPES.includes(mimeType as (typeof SUPPORTED_TILE_IMAGE_TYPES)[number])

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Could not read image file.'))
    }

    reader.onerror = () => reject(new Error('Could not read image file.'))
    reader.readAsDataURL(file)
  })

const getImageDimensionsFromBitmap = async (file: File) => {
  if (typeof createImageBitmap !== 'function') {
    return null
  }

  const bitmap = await createImageBitmap(file)

  try {
    return {
      width: bitmap.width,
      height: bitmap.height,
    }
  } finally {
    bitmap.close()
  }
}

const getImageDimensionsFromElement = (dataUrl: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      })
    }

    image.onerror = () => reject(new Error('Could not decode image file.'))
    image.src = dataUrl
  })

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `image_${crypto.randomUUID()}`
  }

  return `image_${Date.now()}`
}

export const readImageFile = async (file: File): Promise<TileImageAsset> => {
  if (!isSupportedTileImageType(file.type)) {
    throw new Error('Unsupported image type. Use PNG, JPG, or WebP.')
  }

  const dataUrl = await readFileAsDataUrl(file)
  const dimensions = (await getImageDimensionsFromBitmap(file)) ?? (await getImageDimensionsFromElement(dataUrl))

  return {
    id: createId(),
    filename: file.name,
    mimeType: file.type,
    width: dimensions.width,
    height: dimensions.height,
    dataUrl,
  }
}

export const isSquareImage = (asset: TileImageAsset) => asset.width === asset.height

export const validateTileImageAsset = (asset: TileImageAsset) => {
  if (!isSupportedTileImageType(asset.mimeType)) {
    return 'Unsupported image type. Use PNG, JPG, or WebP.'
  }

  if (!asset.dataUrl || typeof asset.dataUrl !== 'string') {
    return 'Image file could not be read.'
  }

  if (!isSquareImage(asset)) {
    return 'Tile image must be square.'
  }

  return null
}

export const getTilePreviewSource = (
  tile: Tile,
  previewMode: PreviewMode,
): 'semantic' | TileImageAsset => {
  if (previewMode === 'semantic') {
    return 'semantic'
  }

  const imageAsset = tile.imageAsset ?? null

  if (!imageAsset || validateTileImageAsset(imageAsset)) {
    return 'semantic'
  }

  return imageAsset
}

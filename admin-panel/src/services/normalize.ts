import { resolveAssetUrl, imageResource } from '../utils/assets'

export const normalizePartner = (p: any) => {
  if (!p) return p

  let rawLogoUrl =
    p.logoUrl ||
    p.LogoUrl ||
    p.logo_url ||
    p.Logo_Url ||
    p.logo ||
    p.Logo ||
    p.image ||
    p.Image ||
    p.avatarUrl ||
    p.AvatarUrl ||
    p.avatar ||
    p.Avatar ||
    p.photo ||
    p.Photo ||
    p.imageUrl ||
    p.ImageUrl ||
    p.thumbnail ||
    p.Thumbnail ||
    p.thumbnailUrl ||
    p.ThumbnailUrl

  if (!rawLogoUrl && p.images && Array.isArray(p.images) && p.images.length > 0) rawLogoUrl = p.images[0]
  if (!rawLogoUrl && p.Images && Array.isArray(p.Images) && p.Images.length > 0) rawLogoUrl = p.Images[0]
  if (!rawLogoUrl && p.media && Array.isArray(p.media) && p.media.length > 0) rawLogoUrl = p.media[0]
  if (!rawLogoUrl && p.Media && Array.isArray(p.Media) && p.Media.length > 0) rawLogoUrl = p.Media[0]
  if (!rawLogoUrl && p.logo && typeof p.logo === 'object' && (p.logo.url || p.logo.path)) rawLogoUrl = p.logo.url || p.logo.path
  if (!rawLogoUrl && p.Logo && typeof p.Logo === 'object' && (p.Logo.url || p.Logo.path)) rawLogoUrl = p.Logo.url || p.Logo.path

  const logoUrl = resolveAssetUrl(String(rawLogoUrl || '')) || undefined

  const rawCoverUrl =
    p.coverUrl ||
    p.CoverUrl ||
    p.cover_image_url ||
    p.Cover_Image_Url ||
    p.cover ||
    p.Cover ||
    p.coverImageUrl ||
    p.CoverImageUrl ||
    p.image ||
    p.Image ||
    p.photo ||
    p.Photo

  const coverUrl = resolveAssetUrl(String(rawCoverUrl || '')) || imageResource('banner_2.png')

  return {
    ...p,
    logoUrl,
    coverUrl
  }
}

export const normalizeProduct = (prod: any) => {
  if (!prod) return prod

  let rawImageUrl =
    prod.imageUrl ||
    prod.ImageUrl ||
    prod.image_url ||
    prod.Image_Url ||
    prod.image ||
    prod.Image ||
    prod.photo ||
    prod.Photo ||
    prod.photoUrl ||
    prod.PhotoUrl ||
    prod.thumbnail ||
    prod.Thumbnail ||
    prod.thumbnailUrl ||
    prod.ThumbnailUrl ||
    prod.picture ||
    prod.Picture

  if (!rawImageUrl && Array.isArray(prod.images) && prod.images.length > 0) rawImageUrl = prod.images[0]
  if (!rawImageUrl && Array.isArray(prod.Images) && prod.Images.length > 0) rawImageUrl = prod.Images[0]
  if (!rawImageUrl && Array.isArray(prod.photos) && prod.photos.length > 0) rawImageUrl = prod.photos[0]

  if (!rawImageUrl && prod.image && typeof prod.image === 'object' && (prod.image.url || prod.image.path)) rawImageUrl = prod.image.url || prod.image.path
  if (!rawImageUrl && prod.Image && typeof prod.Image === 'object' && (prod.Image.url || prod.Image.path)) rawImageUrl = prod.Image.url || prod.Image.path

  const imageUrl = resolveAssetUrl(String(rawImageUrl || '')) || undefined

  return {
    ...prod,
    image: imageUrl,
    imageUrl
  }
}

export default {
  normalizePartner,
  normalizeProduct
}



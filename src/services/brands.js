/*
|--------------------------------------------------------------------------
| Brand API service  (src/services/brands.js)
|--------------------------------------------------------------------------
| Backend: BrandController  @RequestMapping("/api/brands")
|   GET    /brands            public
|   POST   /brands            staff   body: { name }
|   PUT    /brands/{id}       staff   body: { name }
|   POST   /brands/{id}/upload staff  multipart, file part "image"
|   DELETE /brands/{id}       staff
|
| NOTE: BrandRequestDTO carries only `name`. The image is uploaded through
| its own endpoint, so create/update the brand first, then upload the image.
|
| Verified against BrandController / BrandResponseDTO:
|   - upload endpoint: POST /api/brands/{id}/upload, @RequestPart("image")
|   - response JSON: { id, name, imageUrl }
|   - roles: ADMIN, MANAGER, STAFF (GET is public)
|
| ⚠ Still to check by hand: the axios instance import path below
|   (copy it from the `import api ...` line in src/services/cloudinary.js).
*/
import api from '@/services/api' // ⚠ change to match `import api ...` in src/services/cloudinary.js

const IMAGE_FIELD = 'image' // multipart field name expected by the controller
const imageEndpoint = (id) => `/brands/${id}/upload`

/** JSON field may be `imageUrl` (entity) or `brandImage` — accept either. */
export function brandImageOf(brand) {
  return brand?.imageUrl ?? brand?.brandImage ?? brand?.image ?? ''
}

export async function fetchBrands() {
  const { data } = await api.get('/brands')
  return Array.isArray(data) ? data : data?.content ?? []
}

export async function createBrand(name) {
  const { data } = await api.post('/brands', { name })
  return data
}

export async function updateBrand(id, name) {
  const { data } = await api.put(`/brands/${id}`, { name })
  return data
}

export async function uploadBrandImage(id, file) {
  const formData = new FormData()
  formData.append(IMAGE_FIELD, file)
  // Don't set Content-Type manually — the browser adds the multipart boundary.
  const { data } = await api.post(imageEndpoint(id), formData)
  return data
}

export async function deleteBrand(id) {
  await api.delete(`/brands/${id}`)
}

export default { fetchBrands, createBrand, updateBrand, uploadBrandImage, deleteBrand, brandImageOf }
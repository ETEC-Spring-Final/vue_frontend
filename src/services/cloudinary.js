// services/cloudinary.js
//
// Image uploads now go through the backend (POST /api/uploads) instead of
// calling Cloudinary directly from the browser. The backend holds the
// Cloudinary credentials and validates file type/size and the folder
// name. This service reuses the project's axios instance (services/api.js),
// which already attaches the JWT and targets baseURL "/api" — so
// api.post('/uploads') reaches /api/uploads.
import api from './api'

/**
 * @param {File} file
 * @param {string} folder - backend allow-listed folder, e.g.
 *   'profile-pictures', 'vehicle-images', 'site-settings',
 *   'admin-profiles', 'misc'
 * @returns {Promise<{ url: string, publicId: string, uploadedAt: string }>}
 */
export async function uploadToCloudinary(file, folder = 'misc') {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const { data } = await api.post('/uploads', formData, { params: { folder } })
    return data
  } catch (err) {
    // Backend validation failures are plain-text 400s (e.g.
    // "File too large: max size is 5MB"). Re-throw with that text so the
    // callers can surface it through their existing err.message fallback.
    const backendMessage =
      typeof err.response?.data === 'string' && err.response.data.trim()
        ? err.response.data.trim()
        : ''
    throw new Error(
      backendMessage ||
        err.response?.data?.message ||
        err.message ||
        'Could not upload the image.'
    )
  }
}

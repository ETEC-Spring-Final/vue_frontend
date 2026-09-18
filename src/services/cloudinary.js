// services/cloudinary.js
//
// Unsigned upload directly from the browser to Cloudinary — same
// approach Settings.vue uses for the site logo/favicon (confirmed by
// the "cloudinaryNotConfigured" locale key referencing VITE_CLOUDINARY_*
// env vars).
//
// ⚠️ ASSUMPTION: env var names below (VITE_CLOUDINARY_CLOUD_NAME,
// VITE_CLOUDINARY_UPLOAD_PRESET) are guessed from the locale key name.
// Please confirm against Settings.vue's script and rename here if they
// differ (e.g. VITE_CLOUDINARY_PRESET instead of _UPLOAD_PRESET).
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * @param {File} file
 * @param {string} folder - Cloudinary folder, e.g. 'avatars' (mirrors
 *   the existing 'vehicle-images' folder convention)
 * @returns {Promise<string>} the uploaded image's secure_url
 */
export async function uploadToCloudinary(file, folder = 'misc') {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured (missing VITE_CLOUDINARY_* env vars).')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    throw new Error('Could not upload the image.')
  }
  const data = await res.json()
  return data.secure_url
}
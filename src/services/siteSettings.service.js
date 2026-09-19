import api from '@/services/api'

/**
 * GET /api/settings — public, no auth required.
 * @returns {Promise<object>} SiteSettingsResponseDTO shape
 */
export async function getSiteSettings() {
  const { data } = await api.get('/settings')
  return data
}

/**
 * PUT /api/settings — requires ADMIN or MANAGER role.
 * @param {object} payload SiteSettingsRequestDTO shape
 */
export async function updateSiteSettings(payload) {
  const { data } = await api.put('/settings', payload)
  return data
}
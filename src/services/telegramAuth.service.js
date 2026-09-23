import api from '@/services/api'

/**
 * Sends the raw payload from the Telegram Login Widget's onauth callback
 * to the backend for hash verification + login/registration.
 * @param {object} payload - { id, first_name, last_name, username, photo_url, auth_date, hash }
 * @returns {Promise<{id:number, email:string, role:string, token:string}>}
 */
export async function telegramLogin(payload) {
  const { data } = await api.post('/auth/telegram', payload)
  return data
}
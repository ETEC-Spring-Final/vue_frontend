/*
|--------------------------------------------------------------------------
| File: services/profile.service.js
|--------------------------------------------------------------------------
|
| Thin wrapper around the "My Profile" self-service endpoints
| (/api/user-profiles/me*). Uses the shared axios instance from
| services/api.js, which already attaches the Bearer token from
| localStorage — no need to pass it manually here.
|
*/

import api from '@/services/api'

/**
 * @returns {Promise<{id:number, firstName:string, lastName:string, email:string,
 *   phone:string, gender:string, role:string, profilePicture:string,
 *   active:boolean, authProvider:string, createdAt:string, updatedAt:string}>}
 */
export async function getMyProfile() {
  const { data } = await api.get('/user-profiles/me')
  return data
}

/**
 * @param {{firstName:string, lastName:string, phone:string, profilePicture?:string}} payload
 */
export async function updateMyProfile(payload) {
  const { data } = await api.put('/user-profiles/me', payload)
  return data
}

/**
 * @param {{currentPassword:string, newPassword:string, confirmPassword:string}} payload
 */
export async function changeMyPassword(payload) {
  await api.post('/user-profiles/me/change-password', payload)
}

/**
 * @param {{page?:number, size?:number}} params
 */
export async function getMyLoginHistory(params = {}) {
  const { data } = await api.get('/user-profiles/me/login-history', { params })
  return data // Spring Page: { content, totalPages, totalElements, number, ... }
}
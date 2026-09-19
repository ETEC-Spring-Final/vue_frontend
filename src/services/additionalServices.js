// src/services/additionalServices.js
// Per-day rental add-ons (extra driver, GPS, child seat, insurance etc).
// Public GET — the booking page lists these and sends back the selected ids
// as `serviceIds` on the reservation payload.

import api from '@/services/api'

/**
 * GET /api/additional-services
 * @returns {Promise<Array<{id:number,name:string,nameKh:string,description:string,pricePerDay:number,icon:string,active:boolean}>>}
 */
export async function getAdditionalServices() {
  const { data } = await api.get('/additional-services')
  return data
}
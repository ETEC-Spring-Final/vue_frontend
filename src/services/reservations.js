// src/services/reservations.js
// Reservation API service layer — mirrors the pattern used in vehicles.js.
// All calls go through the shared axios instance (services/api.js), which already
// attaches the JWT bearer token and baseURL: "/api".

import api from "./api";

/**
 * Create a new reservation.
 * POST /api/reservations
 * @param {Object} payload
 * @param {number} payload.vehicleId
 * @param {number} payload.pickupLocationId
 * @param {number} payload.returnLocationId
 * @param {string} payload.pickupDate   ISO date string (yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss)
 * @param {string} payload.returnDate
 * @param {number[]} [payload.serviceIds]  optional additional services
 * @param {string} [payload.discountCode]  optional discount/promo code
 * @returns {Promise<Object>} created reservation
 */
export async function createReservation(payload) {
  const { data } = await api.post("/reservations", payload);
  return data;
}

/**
 * Get the current user's reservations.
 * GET /api/reservations/my-reservations
 * @returns {Promise<Array>} list of reservations
 */
export async function getMyReservations() {
  const { data } = await api.get("/reservations/my-reservations");
  return data;
}

/**
 * Get a single reservation by id.
 * GET /api/reservations/{id}
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function getReservationById(id) {
  const { data } = await api.get(`/reservations/${id}`);
  return data;
}

/**
 * Cancel a reservation (owner action).
 * PATCH /api/reservations/{id}/cancel
 * @param {number|string} id
 * @returns {Promise<Object>} updated reservation
 */
export async function cancelReservation(id) {
  const { data } = await api.patch(`/reservations/${id}/cancel`);
  return data;
}

/**
 * (Admin/Manager/Staff only) update reservation status.
 * PATCH /api/reservations/{id}/status?status=X
 * @param {number|string} id
 * @param {string} status  one of the ReservationStatusEnum values
 * @returns {Promise<Object>}
 */
export async function updateReservationStatus(id, status) {
  const { data } = await api.patch(`/reservations/${id}/status`, null, {
    params: { status },
  });
  return data;
}

// ---------------------------------------------------------------------------
// Supporting lookups needed by the reservation form
// ---------------------------------------------------------------------------

/**
 * List all pickup/return locations.
 * GET /api/locations
 * @returns {Promise<Array>}
 */
export async function getLocations() {
  const { data } = await api.get("/locations");
  return data;
}

/**
 * List available maintenance/rental add-on services (insurance add-ons etc).
 * GET /api/services
 * @returns {Promise<Array>}
 */
export async function getServices() {
  const { data } = await api.get("/services");
  return data;
}

/**
 * List available discounts (public, so the form can show applicable codes).
 * GET /api/discounts
 * @returns {Promise<Array>}
 */
export async function getDiscounts() {
  const { data } = await api.get("/discounts");
  return data;
}

// ---------------------------------------------------------------------------
// Client-side price breakdown helper
// Formula (per Agent Guide §5.3): (price × days) + insurance + services − discount
// ---------------------------------------------------------------------------

/**
 * Compute a price breakdown for display before submitting the reservation.
 * This is a UI preview only — the backend recalculates and is the source of truth.
 *
 * @param {Object} params
 * @param {number} params.pricePerDay
 * @param {string|Date} params.pickupDate
 * @param {string|Date} params.returnDate
 * @param {number} [params.insurancePerDay=0]
 * @param {Array<{price:number}>} [params.selectedServices=[]]
 * @param {Object|null} [params.discount] { type: 'PERCENTAGE'|'FIXED', value: number }
 * @returns {{days:number, rentalTotal:number, insuranceTotal:number, servicesTotal:number, discountAmount:number, grandTotal:number}}
 */
export function calculatePriceBreakdown({
  pricePerDay,
  pickupDate,
  returnDate,
  insurancePerDay = 0,
  selectedServices = [],
  discount = null,
}) {
  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.round((end - start) / msPerDay));

  const rentalTotal = pricePerDay * days;
  const insuranceTotal = insurancePerDay * days;
  const servicesTotal = selectedServices.reduce(
    (sum, s) => sum + (s.price || 0),
    0
  );

  const subtotal = rentalTotal + insuranceTotal + servicesTotal;

  let discountAmount = 0;
  if (discount) {
    discountAmount =
      discount.type === "PERCENTAGE"
        ? subtotal * (discount.value / 100)
        : discount.value;
  }

  const grandTotal = Math.max(0, subtotal - discountAmount);

  return {
    days,
    rentalTotal,
    insuranceTotal,
    servicesTotal,
    discountAmount,
    grandTotal,
  };
}
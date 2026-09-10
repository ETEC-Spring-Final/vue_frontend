// src/services/rentals.js
// Rental history service layer — mirrors the pattern used in reservations.js.

import api from "./api";

/**
 * Get the current user's rentals (current/upcoming/completed — grouped
 * client-side by status, see RentalHistory.vue).
 * GET /api/rentals/my-rentals
 * @returns {Promise<Array>}
 */
export async function getMyRentals() {
  const { data } = await api.get("/rentals/my-rentals");
  return data;
}

/**
 * Get a single rental by id.
 * GET /api/rentals/{id}
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function getRentalById(id) {
  const { data } = await api.get(`/rentals/${id}`);
  return data;
}

/**
 * Upload a driver document for a rental (license, ID, etc).
 * POST /api/rental-documents/{rentalId}/upload  (multipart/form-data)
 * @param {number|string} rentalId
 * @param {File} file
 * @param {string} [documentType]  optional, matches DocumentTypeEnum if the
 *   backend expects it as a form field alongside the file
 * @returns {Promise<Object>} uploaded document metadata
 */
export async function uploadRentalDocument(rentalId, file, documentType) {
  const formData = new FormData();
  formData.append("file", file);
  if (documentType) formData.append("documentType", documentType);

  const { data } = await api.post(
    `/rental-documents/${rentalId}/upload`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

/**
 * Get all documents the current user has uploaded across their rentals.
 * GET /api/rental-documents/my-rental-document
 * @returns {Promise<Array>}
 */
export async function getMyRentalDocuments() {
  const { data } = await api.get("/rental-documents/my-rental-document");
  return data;
}

/**
 * Get the inspection report for a rental (pickup/return condition, etc).
 * GET /api/inspections/rental/{rentalId}
 * @param {number|string} rentalId
 * @returns {Promise<Object|null>} null if no inspection exists yet — the
 *   backend may 404 for a rental that hasn't been inspected, so callers
 *   should treat that as "not available yet" rather than a hard error.
 */
export async function getRentalInspection(rentalId) {
  try {
    const { data } = await api.get(`/inspections/rental/${rentalId}`);
    return data;
  } catch (e) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Status timeline helper
// Lifecycle (per Agent Guide): Pending → Confirmed → Picked Up →
// Active Rental → Returned → Completed
// ---------------------------------------------------------------------------

export const RENTAL_STATUS_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PICKED_UP",
  "ACTIVE_RENTAL",
  "RETURNED",
  "COMPLETED",
];

/**
 * Return the index of a status within the lifecycle, for driving a
 * step/progress timeline UI. Unknown statuses (e.g. CANCELLED) return -1.
 * @param {string} status
 * @returns {number}
 */
export function rentalStatusStepIndex(status) {
  return RENTAL_STATUS_STEPS.indexOf(status);
}
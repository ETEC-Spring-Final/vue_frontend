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
 *
 * FIX (Phase A): the backend removed the multipart endpoint this used to
 * call — POST /rental-documents/{rentalId}/upload — see AGENTS.md §2.1/§2.6
 * ("the active flow is Cloudinary-style ... local multipart upload is
 * deprecated"). Calling it here 404'd every time a customer tried to
 * upload a document. This now follows the same two-step attachment flow
 * used by VehicleManagement.vue for vehicle images:
 *
 *   1. The caller uploads the raw file to Cloudinary (or whatever asset
 *      host the app uses) FIRST, in the component, and gets back a public
 *      `fileUrl`. This function does not touch the file/FormData at all —
 *      it only knows about the already-hosted URL.
 *   2. POST /api/attachments { fileUrl, documentType, isPrimary,
 *      displayOrder } to register that URL and get back an attachmentId.
 *   3. POST /api/rental-documents { rentalId, attachmentId } to link the
 *      attachment to this rental.
 *
 * @param {number|string} rentalId
 * @param {string} fileUrl  public URL of the already-uploaded file
 * @param {string} [documentType]  matches DocumentTypeEnum, e.g. "LICENSE" | "ID_CARD"
 * @returns {Promise<Object>} the created rental-document record
 */
export async function uploadRentalDocument(rentalId, fileUrl, documentType) {
  const { data: attachment } = await api.post("/attachments", {
    fileUrl,
    documentType,
    isPrimary: true,
    displayOrder: 0,
  });

  const { data: rentalDocument } = await api.post("/rental-documents", {
    rentalId,
    attachmentId: attachment.id,
  });

  return rentalDocument;
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
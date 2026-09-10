// src/services/favorites.js
// Favorites list endpoint. addFavorite()/removeFavorite() already live in
// services/vehicles.js (used by VehicleDetail.vue's heart toggle) — reuse
// those rather than duplicating them here.

import api from "./api";

/**
 * Get the current user's favorited vehicles.
 * GET /api/favorites
 * @returns {Promise<Array>} raw list — each item may be a Favorite record
 *   with a nested `vehicle`, or a Vehicle directly, depending on the
 *   backend DTO. Callers should normalize defensively (see Favorites.vue).
 */
export async function getFavorites() {
  const { data } = await api.get("/favorites");
  return data;
}
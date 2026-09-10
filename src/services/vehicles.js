/*
|--------------------------------------------------------------------------
| File: services/vehicles.js
|--------------------------------------------------------------------------
|
| Vehicle + favorites + reviews HTTP calls, per Agent Guide §2 API reference:
|   GET    /api/vehicles                          Public — list all vehicles
|   GET    /api/vehicles/{id}                     Public — get one vehicle
|   GET    /api/vehicle-images/{id}                Public — images for a vehicle
|   GET    /api/reviews/vehicle/{id}?page=&size=  Public — paginated reviews
|   GET    /api/favorites                          JWT — my favorites
|   POST   /api/favorites/{vehicleId}              JWT — add to favorites
|   DELETE /api/favorites/{vehicleId}              JWT — remove from favorites
|
| Field names below (brand, model, type, pricePerDay, transmission, fuel,
| seats, year, color, mileage, status) are best-guess from the Agent
| Guide's page specs — the guide doesn't paste the exact response DTOs.
| Adjust `normalizeVehicle()` / `normalizeReview()` if the real response
| uses different keys.
|
*/

import api from '@/services/api'

export function fetchVehicles(params = {}) {
  return api.get('/vehicles', { params })
}

export function fetchVehicleById(id) {
  return api.get(`/vehicles/${id}`)
}

export function fetchVehicleImages(vehicleId) {
  return api.get(`/vehicle-images/${vehicleId}`)
}

export function fetchVehicleReviews(vehicleId, { page = 0, size = 8 } = {}) {
  return api.get(`/reviews/vehicle/${vehicleId}`, { params: { page, size } })
}

export function fetchMyFavorites() {
  return api.get('/favorites')
}

export function addFavorite(vehicleId) {
  return api.post(`/favorites/${vehicleId}`)
}

export function removeFavorite(vehicleId) {
  return api.delete(`/favorites/${vehicleId}`)
}

// Normalizes a raw vehicle record from the list endpoint (Home.vue card view).
export function normalizeVehicle(v) {
  return {
    id: v.id,
    name: [v.brand, v.model].filter(Boolean).join(' ') || v.name || 'Vehicle',
    brand: v.brand,
    type: v.type ?? v.carType ?? '—',
    price: v.pricePerDay ?? v.dailyRate ?? v.price ?? 0,
    transmission: v.transmission ?? '—',
    fuel: v.fuel ?? v.fuelType ?? '—',
    seats: v.seats ?? v.seatCount ?? '—',
    favorite: false,
  }
}

// Normalizes a raw vehicle record from the detail endpoint (VehicleDetail.vue) —
// same base fields as normalizeVehicle, plus the extra spec fields the
// detail page needs.
export function normalizeVehicleDetail(v) {
  return {
    ...normalizeVehicle(v),
    year: v.year ?? '—',
    color: v.color ?? '—',
    mileage: v.mileage ?? v.odometer ?? null,
    status: v.status ?? 'AVAILABLE',
    licensePlate: v.licensePlate ?? v.plateNumber ?? '',
  }
}

export function normalizeImage(img) {
  return img.url ?? img.imageUrl ?? img.path ?? null
}

export function normalizeReview(r) {
  return {
    id: r.id,
    rating: r.rating ?? 0,
    comment: r.comment ?? r.text ?? '',
    authorName: r.userName ?? r.author ?? r.user?.firstName ?? 'Anonymous',
    createdAt: r.createdAt ?? null,
  }
}
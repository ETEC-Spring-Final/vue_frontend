/*
|--------------------------------------------------------------------------
| File: services/vehicles.js
|--------------------------------------------------------------------------
|
| Vehicle + favorites + reviews HTTP calls.
|   GET    /api/vehicles                          Public — list all vehicles
|          (?brandId=&type=&transmission=&fuelType=&minPrice=&maxPrice=&seats=)
|   GET    /api/vehicles/{id}                     Public — get one vehicle
|   GET    /api/vehicle-images/{id}                Public — images for a vehicle
|   GET    /api/reviews/vehicle/{id}?page=&size=  Public — paginated reviews
|   GET    /api/favorites                          JWT — my favorites
|   POST   /api/favorites/{vehicleId}              JWT — add to favorites
|   DELETE /api/favorites/{vehicleId}              JWT — remove from favorites
|
| FIX (2026-09): field names below now match the real VehicleResponseDTO /
| VehicleImageResponseDTO from the backend (brandName, yearOfManufacture,
| mileAge, nested attachment) — previously mismatched keys (brand, year,
| mileage, flat image url) silently produced blank/undefined values with
| no console error.
|
*/

import api from '@/services/api'

export function fetchVehicles(params = {}) {
  // params: { brandId, type, transmission, fuelType, minPrice, maxPrice, seats }
  return api.get('/vehicles', { params })
}

export function fetchVehiclesByBrand(brandId) {
  return api.get('/vehicles', { params: { brandId } })
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
    name: [v.brandName, v.model].filter(Boolean).join(' ') || v.name || 'Vehicle',
    brand: v.brandName,
    type: v.type ?? v.carType ?? '—',
    price: v.pricePerDay ?? v.dailyRate ?? v.price ?? 0,
    transmission: v.transmission ?? '—',
    fuel: v.fuelType ?? v.fuel ?? '—',
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
    year: v.yearOfManufacture ?? '—',
    color: v.color ?? '—',
    doors: v.doors ?? null,
    luggages: v.luggages ?? null,
    mileage: v.mileAge ?? null,
    status: v.status ?? 'AVAILABLE',
    licensePlate: v.licensePlate ?? v.plateNumber ?? '',
  }
}

// VehicleImageResponseDTO shape: { id, vehicleId, attachment: {...} }
// The URL lives inside `attachment`, not on the image record itself.
export function normalizeImage(img) {
  const a = img.attachment ?? img
  return a.fileUrl ?? a.url ?? a.imageUrl ?? a.path ?? null
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
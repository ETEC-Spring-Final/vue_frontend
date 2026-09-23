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
| NEW: normalizeVehicle now also carries `brandId` and `brandImage`
| (VehicleResponseDTO.brandImage = the brand's logo URL) so cards and brand
| chips can show the logo. `image` is initialised to null so the property is
| reactive before the cover image request resolves.
|
| NEW (2026-09): normalizeVehicle now also carries `status`
| (VehicleResponseDTO.status — AVAILABLE/RESERVED/RENTED/MAINTENANCE) so
| VehicleCard can show an "Unavailable" state, plus best-effort
| `discountPercent`/`originalPrice` passthroughs for whenever the backend
| adds a discount field to VehicleResponseDTO — they resolve to null today
| and simply don't render anything until that field exists.
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

// GET /api/vehicles/{id}/booked-dates
// Date windows already reserved for a vehicle (powers the "unavailable"
// hints on the booking form + client-side overlap check + the VehicleCard
// "unavailable until <date>" badge). Public.
export function fetchBookedDates(vehicleId) {
  return api.get(`/vehicles/${vehicleId}/booked-dates`)
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
    brandId: v.brandId ?? null,
    brandImage: v.brandImage ?? null,
    type: v.type ?? v.carType ?? '—',
    price: v.pricePerDay ?? v.dailyRate ?? v.price ?? 0,
    transmission: v.transmission ?? '—',
    fuel: v.fuelType ?? v.fuel ?? '—',
    seats: v.seats ?? v.seatCount ?? '—',
    image: null, // filled in by Home/Explore once GET /vehicle-images/{id} resolves
    favorite: false,
    // Drives the "Unavailable" card state. VehicleResponseDTO.status is
    // always present, so this defaults sensibly even before any booking exists.
    status: v.status ?? 'AVAILABLE',
    // Best-effort — VehicleResponseDTO doesn't expose a discount field yet.
    // Stays null (renders nothing) until the backend adds one; update the
    // fallback keys here once that DTO is confirmed.
    discountPercent: v.discountPercent ?? v.discount?.percentage ?? null,
    originalPrice: v.originalPrice ?? v.priceBeforeDiscount ?? null,
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

// BookedDateDTO's exact field names aren't confirmed yet (the controller
// only declares `List<BookedDateDTO>`), so this reads several likely
// candidates defensively — same pattern as normalizeImage above. Returns
// { start: Date|null, end: Date|null } or null if nothing parseable.
export function normalizeBookedDate(b) {
  const startRaw = b.startDate ?? b.start ?? b.checkInDate ?? b.pickupDate ?? b.from ?? null
  const endRaw = b.endDate ?? b.end ?? b.checkOutDate ?? b.returnDate ?? b.to ?? null
  const start = startRaw ? new Date(startRaw) : null
  const end = endRaw ? new Date(endRaw) : null
  if (!start && !end) return null
  return { start, end }
}
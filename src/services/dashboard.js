import api from '@/services/api'

/*
|--------------------------------------------------------------------------
| Client-side dashboard aggregation
|--------------------------------------------------------------------------
| Backend has no dedicated stats/analytics endpoint yet (see AGENTS.md §7).
| Everything here is computed from the existing list endpoints:
|   GET /api/vehicles
|   GET /api/reservations
|   GET /api/rentals
|   GET /api/vehicle-images/{vehicleId}
|
| IMPORTANT — enum values below are the exact JSON strings the backend
| returns. Verified against the actual enum source files on 2026-09-21:
|   StatusEnum            (Vehicle)     AVAILABLE, RESERVED, RENTED, MAINTENANCE, UNAVAILABLE
|   RentalStatusEnum      (Rental)      PENDING, CONFIRMED, PICKED_UP, ACTIVE, RETURNED, COMPLETED
|   ReservationStatusEnum (Reservation) PENDING, CONFIRMED, CANCELLED
*/

const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  RENTED: 'RENTED',
  MAINTENANCE: 'MAINTENANCE',
  UNAVAILABLE: 'UNAVAILABLE',
}

const RENTAL_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PICKED_UP: 'PICKED_UP',
  ACTIVE: 'ACTIVE',
  RETURNED: 'RETURNED',
  COMPLETED: 'COMPLETED',
}

const RESERVATION_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
}

function unwrapList(data) {
  return Array.isArray(data) ? data : data?.content ?? []
}

/**
 * Top stat cards + vehicle status breakdown for the donut chart.
 */
export async function fetchDashboardStats() {
  const [vehiclesRes, reservationsRes, rentalsRes] = await Promise.all([
    api.get('/vehicles'),
    api.get('/reservations'),
    api.get('/rentals'),
  ])

  const vehicles = unwrapList(vehiclesRes.data)
  const reservations = unwrapList(reservationsRes.data)
  const rentals = unwrapList(rentalsRes.data)

  const activeRentals = rentals.filter(
    (r) => r.status === RENTAL_STATUS.ACTIVE || r.status === RENTAL_STATUS.PICKED_UP,
  ).length

  return {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter((v) => v.status === VEHICLE_STATUS.AVAILABLE).length,
    activeRentals,
    pendingReservations: reservations.filter((r) => r.status === RESERVATION_STATUS.PENDING).length,
    vehicleStatusBreakdown: {
      AVAILABLE: vehicles.filter((v) => v.status === VEHICLE_STATUS.AVAILABLE).length,
      RENTED: vehicles.filter((v) => v.status === VEHICLE_STATUS.RENTED).length,
      MAINTENANCE: vehicles.filter((v) => v.status === VEHICLE_STATUS.MAINTENANCE).length,
      RESERVED: vehicles.filter((v) => v.status === VEHICLE_STATUS.RESERVED).length,
      UNAVAILABLE: vehicles.filter((v) => v.status === VEHICLE_STATUS.UNAVAILABLE).length,
    },
  }
}

// --- Reservations trend chart (Day / Week / Month / 6 Months) ------------

const TREND_CONFIG = {
  day: { count: 14, unit: 'day' }, // last 14 days, one bar per day
  week: { count: 8, unit: 'week' }, // last 8 weeks, one bar per week (Mon-start)
  month: { count: 12, unit: 'month' }, // last 12 months, one bar per month
  sixMonths: { count: 6, unit: 'month' }, // last 6 months, one bar per month
}

function startOfWeekMonday(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diffToMonday = (d.getDay() + 6) % 7 // 0=Mon..6=Sun
  d.setDate(d.getDate() - diffToMonday)
  return d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Rentals grouped into a trailing window, bucketed by day/week/month
 * depending on `period`. Uses pickUpDateTime, falling back to createdAt.
 *
 * @param {'day'|'week'|'month'|'sixMonths'} period
 * @returns {Promise<{labels: string[], data: number[]}>}
 */
export async function fetchReservationsTrend(period = 'week') {
  const { data } = await api.get('/rentals')
  const rentals = unwrapList(data)
  const config = TREND_CONFIG[period] || TREND_CONFIG.week
  const now = new Date()
  const buckets = []

  if (config.unit === 'day') {
    for (let i = config.count - 1; i >= 0; i--) {
      const d = startOfDay(now)
      d.setDate(d.getDate() - i)
      buckets.push({ key: d.toDateString(), label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: 0 })
    }
    rentals.forEach((r) => {
      const raw = r.pickUpDateTime || r.createdAt
      if (!raw) return
      const key = startOfDay(new Date(raw)).toDateString()
      const bucket = buckets.find((b) => b.key === key)
      if (bucket) bucket.count += 1
    })
  } else if (config.unit === 'week') {
    for (let i = config.count - 1; i >= 0; i--) {
      const d = startOfWeekMonday(now)
      d.setDate(d.getDate() - i * 7)
      buckets.push({ key: d.toDateString(), label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: 0 })
    }
    rentals.forEach((r) => {
      const raw = r.pickUpDateTime || r.createdAt
      if (!raw) return
      const key = startOfWeekMonday(new Date(raw)).toDateString()
      const bucket = buckets.find((b) => b.key === key)
      if (bucket) bucket.count += 1
    })
  } else {
    // month
    for (let i = config.count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), count: 0 })
    }
    rentals.forEach((r) => {
      const raw = r.pickUpDateTime || r.createdAt
      if (!raw) return
      const d = new Date(raw)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const bucket = buckets.find((b) => b.key === key)
      if (bucket) bucket.count += 1
    })
  }

  return { labels: buckets.map((b) => b.label), data: buckets.map((b) => b.count) }
}

// --- Vehicle images + top lists -------------------------------------------

/**
 * Primary image URL for one vehicle (falls back to the first image
 * returned if none is flagged isPrimary). Returns null if the vehicle
 * has no images uploaded yet — callers should show a placeholder icon.
 */
async function fetchVehicleImage(vehicleId) {
  try {
    const { data } = await api.get(`/vehicle-images/${vehicleId}`)
    const images = unwrapList(data)
    if (!images.length) return null
    const primary = images.find((img) => img.attachment?.isPrimary) || images[0]
    return primary?.attachment?.fileUrl ?? null
  } catch (err) {
    console.error(`[Dashboard] failed to load image for vehicle ${vehicleId}:`, err)
    return null
  }
}

/**
 * Top N vehicles by rental count, with primary image. Backend has no
 * "top rented" endpoint, so this counts vehicleId occurrences in
 * /api/rentals client-side, then joins with /api/vehicles for display
 * fields (brandName, model) and fetches each vehicle's primary image.
 */
export async function fetchTopRentedCars(limit = 5) {
  const [rentalsRes, vehiclesRes] = await Promise.all([api.get('/rentals'), api.get('/vehicles')])

  const rentals = unwrapList(rentalsRes.data)
  const vehicles = unwrapList(vehiclesRes.data)
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]))

  const rentalCounts = new Map()
  rentals.forEach((r) => {
    if (!r.vehicleId) return
    rentalCounts.set(r.vehicleId, (rentalCounts.get(r.vehicleId) || 0) + 1)
  })

  const ranked = [...rentalCounts.entries()]
    .map(([vehicleId, count]) => ({ vehicle: vehicleById.get(vehicleId), vehicleId, count }))
    .filter((entry) => entry.vehicle)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  if (!ranked.length) return []

  const maxCount = ranked[0].count
  const images = await Promise.all(ranked.map((entry) => fetchVehicleImage(entry.vehicleId)))

  return ranked.map((entry, i) => ({
    vehicleId: entry.vehicleId,
    brandName: entry.vehicle.brandName,
    model: entry.vehicle.model,
    rentalCount: entry.count,
    percentage: Math.round((entry.count / maxCount) * 100),
    imageUrl: images[i],
  }))
}

/**
 * Top N vehicle brands by rental count (join rentals → vehicle → brandName).
 */
export async function fetchTopBrands(limit = 5) {
  const [rentalsRes, vehiclesRes] = await Promise.all([api.get('/rentals'), api.get('/vehicles')])

  const rentals = unwrapList(rentalsRes.data)
  const vehicles = unwrapList(vehiclesRes.data)
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]))

  const brandCounts = new Map()
  rentals.forEach((r) => {
    const vehicle = vehicleById.get(r.vehicleId)
    if (!vehicle) return
    const key = vehicle.brandName || 'Unknown'
    brandCounts.set(key, (brandCounts.get(key) || 0) + 1)
  })

  const maxCount = Math.max(1, ...brandCounts.values())

  return [...brandCounts.entries()]
    .map(([brandName, count]) => ({ brandName, count, percentage: Math.round((count / maxCount) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
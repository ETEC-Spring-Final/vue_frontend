import api from '@/services/api'

/**
 * NOTE: the backend has no dedicated stats/analytics endpoint yet
 * (see AGENTS.md §7 "Reports/analytics endpoints... not yet implemented").
 * Stat cards are computed client-side from list endpoints in the meantime —
 * swap these for a real /api/admin/stats call once the backend adds one.
 */
export async function fetchDashboardStats() {
  const [vehicles, reservations, rentals] = await Promise.all([
    api.get('/vehicles'),
    api.get('/reservations'),
    api.get('/rentals'),
  ])

  const vehicleList = Array.isArray(vehicles.data) ? vehicles.data : vehicles.data?.content ?? []
  const reservationList = Array.isArray(reservations.data) ? reservations.data : reservations.data?.content ?? []
  const rentalList = Array.isArray(rentals.data) ? rentals.data : rentals.data?.content ?? []

  return {
    totalVehicles: vehicleList.length,
    availableVehicles: vehicleList.filter((v) => v.status === 'AVAILABLE').length,
    activeRentals: rentalList.filter((r) => r.status === 'Active Rental').length,
    pendingReservations: reservationList.filter((r) => r.status === 'Pending').length,
  }
}
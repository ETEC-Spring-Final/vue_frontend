import { ref } from 'vue'

const collapsed = ref(false)
const mobileOpen = ref(false)

export function useSidebar() {
  function toggleCollapsed() {
    collapsed.value = !collapsed.value
  }
  function toggleMobile() {
    mobileOpen.value = !mobileOpen.value
  }
  function closeMobile() {
    mobileOpen.value = false
  }
  return { collapsed, mobileOpen, toggleCollapsed, toggleMobile, closeMobile }
}
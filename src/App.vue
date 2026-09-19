<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
// ...your existing imports (AppHeader, etc.)

const route = useRoute()
const authPages = ['/login', '/register']
const transitionName = ref('slide-left')

watch(
  () => route.path,
  (to, from) => {
    if (authPages.includes(to) && authPages.includes(from)) {
      // Register -> Login slides right, Login -> Register slides left
      transitionName.value = to === '/login' ? 'slide-right' : 'slide-left'
    } else {
      transitionName.value = 'fade'
    }
  }
)
</script>

<template>
  <!-- ...your existing header logic... -->
  <router-view v-slot="{ Component }">
    <transition :name="transitionName" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active,
.fade-enter-active, .fade-leave-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-left-enter-from { opacity: 0; transform: translateX(40px); }
.slide-left-leave-to { opacity: 0; transform: translateX(-40px); }

.slide-right-enter-from { opacity: 0; transform: translateX(-40px); }
.slide-right-leave-to { opacity: 0; transform: translateX(40px); }

.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

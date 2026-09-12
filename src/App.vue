<template>
  <AppHeader v-if="!route.meta.hideGlobalHeader" />
  <RouterView />
</template>

<script setup>
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
const route = useRoute()
</script>
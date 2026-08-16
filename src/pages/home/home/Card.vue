<template>
  <div class="card">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String
})
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  padding: 16px;
  margin: 8px;
}
</style>
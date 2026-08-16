/*
|--------------------------------------------------------------------------
| File: DefaultLayout.vue
|--------------------------------------------------------------------------
|
| Description:
| Base layout wrapper used across standard pages in the application.
| Provides a consistent structure with header, main content area, and footer.
|
| Responsibilities:
| - Define common UI structure (header / content / footer)
| - Render dynamic page content via <slot />
| - Serve as default layout for most routes
|
| Notes:
| - Keep layout clean and reusable
| - Replace placeholder header/footer with real components when needed
| - Can be extended (sidebar, navigation, auth guards)
|
*/

<template>
  <!-- Layout container -->
  <div class="min-h-screen flex flex-col">

    <!-- Header section -->
    <header class="border-b border-black/10 p-4 text-sm font-medium">
      Default Header
    </header>

    <!-- Main content area -->
    <main class="flex-1 p-4">
      <!-- Page content will be injected here -->
      <slot />
    </main>

    <!-- Footer section -->
    <footer class="border-t border-black/10 p-4 text-xs text-gray-500 text-center">
      Default Footer
    </footer>

  </div>
</template>

<script setup>
/**
 * Default layout wrapper
 * Used for general pages (dashboard, content pages, etc.)
 */
</script>

<style scoped>
/* Keep styles minimal — prefer Tailwind utilities */
</style>
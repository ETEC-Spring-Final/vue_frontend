/*
|--------------------------------------------------------------------------
| File: Preview.vue
|--------------------------------------------------------------------------
|
| Description:
| Renders the preview page combining the LeftPanel (overview) and
| RightPanel (project structure). Serves as the landing/demo screen.
|
| Responsibilities:
| - Compose preview layout (two panels)
| - Provide responsive container (stack on mobile, side-by-side on desktop)
| - Render decorative background grid
|
| Dependencies:
| - LeftPannel.vue
| - RightPannel.vue
|
| Notes:
| - Mobile-first: panels stack vertically, switch to row on lg breakpoint
| - Keep this file layout-focused (no business logic)
|
*/

<script setup>
import LeftPannel from './components/LeftPannel.vue';
import RightPannel from './components/RightPannel.vue';
</script>

<template>
  <!-- Page wrapper: centers content and applies background -->
  <div class="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 py-8 bg-[#f7f7f7] overflow-hidden">

    <!-- Background grid (decorative only) -->
    <div class="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:36px_36px]"></div>

    <!-- Main container: responsive two-panel layout -->
    <div class="relative z-10 w-full max-w-[1200px] bg-white border border-black/10 rounded-2xl shadow-sm flex flex-col lg:flex-row overflow-hidden">

      <!-- Left panel: overview / marketing content -->
      <LeftPannel />

      <!-- Right panel: project structure preview -->
      <RightPannel />

    </div>
  </div>
</template>
/*
|--------------------------------------------------------------------------
| File: RightPanel.vue
|--------------------------------------------------------------------------
|
| Description:
| Renders the right-side preview panel showing the project structure in a
| code-editor style UI. Includes quick navigation links to demo pages.
|
| Responsibilities:
| - Display project folder structure (via PreText component)
| - Provide navigation shortcuts (login, register, dashboard)
| - Simulate a lightweight code viewer interface
|
| Dependencies:
| - PreText.vue (structure renderer)
| - Vue Router (router-link)
|
| Notes:
| - Intended for onboarding/demo of project architecture
| - Can be extended with interactive tree (expand/collapse, icons)
|
*/

<script setup>
import PreText from './PreText.vue';

/**
 * Navigation links for demo pages.
 * Extend this list to add more preview routes.
 */
const navLinks = [
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'home', path: '/home' },
]
</script>

<template>
  <!-- Right-side panel: structure preview -->
  <div class="w-full lg:w-[56%] bg-[#fafafa] p-4 sm:p-6 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-black/10">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <!-- Section label -->
      <span class="text-[11px] tracking-widest uppercase">
        project structure
      </span>

      <!-- Navigation links -->
      <div class="flex flex-wrap gap-3 items-center">

        <span class="text-xs text-gray-400 font-mono">
          Demo:
        </span>

        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="font-mono text-xs text-gray-500 hover:underline underline-offset-4 decoration-black transition"
        >
          {{ link.name }}
        </router-link>

      </div>

    </div>

    <!-- Code viewer container -->
    <div class="flex-1 bg-white rounded-xl border border-black/10 overflow-hidden flex flex-col">

      <!-- Window header (macOS-style controls + path) -->
      <div class="flex items-center justify-between px-4 py-2 border-b border-black/10 bg-[#f5f5f5]">

        <!-- Window controls -->
        <div class="flex gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
        </div>

        <!-- Current directory label -->
        <span class="font-mono text-[11px]">
          /src
        </span>

      </div>

      <!-- Project structure (rendered by PreText.vue) -->
      <div class="p-2 overflow-auto flex-1">
        <PreText />
      </div>

    </div>

  </div>
</template>
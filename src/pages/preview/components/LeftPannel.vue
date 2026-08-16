/*
|--------------------------------------------------------------------------
| File: LeftPanel.vue
|--------------------------------------------------------------------------
|
| Description:
| Renders the left-side overview panel for the starter template.
| Presents project identity, short description, and key features.
|
| Responsibilities:
| - Communicate what the template is and why it exists
| - Highlight core technologies (Vue, Router, Tailwind, Components)
| - Provide a link to the repository
|
| Notes:
| - Keep content concise and readable
| - Designed for first impression / onboarding screen
|
*/

<template>
  <!-- Left panel: overview / marketing summary -->
  <div class="w-full lg:w-[44%] p-6 sm:p-8 lg:p-14 flex flex-col justify-between">

    <!-- Top section: badge, title, description, features -->
    <div>

      <!-- Project badge / meta -->
      <div class="text-xs font-mono text-gray-400 mb-6">
        vue 3 · composition api · 2026
      </div>

      <!-- Main title -->
      <h1 class="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black mb-5 leading-tight">
        Vue 3 Starter
      </h1>

      <!-- Short description -->
      <p class="text-gray-600 mb-8 sm:mb-10 leading-relaxed">
        Minimal, scalable frontend structure designed for clean architecture and fast development.
      </p>

      <!-- Feature list -->
      <div class="space-y-3 text-sm">

        <!-- Core framework -->
        <div class="flex justify-between border-b border-black/5 pb-2">
          <span>Vue 3</span>
          <span class="font-mono text-gray-400">v3</span>
        </div>

        <!-- Routing -->
        <div class="flex justify-between border-b border-black/5 pb-2">
          <span>Vue Router</span>
          <span class="font-mono text-gray-400">rt</span>
        </div>

        <!-- Styling -->
        <div class="flex justify-between border-b border-black/5 pb-2">
          <span>Tailwind CSS</span>
          <span class="font-mono text-gray-400">tw</span>
        </div>

        <!-- Component architecture -->
        <div class="flex justify-between border-b border-black/5 pb-2">
          <span>Reusable Components</span>
          <span class="font-mono text-gray-400">cx</span>
        </div>

      </div>
    </div>

    <!-- Footer: repo link + attribution -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-10">

      <!-- Repository link -->
      <a
        href="https://github.com/knr-smey/structure_project_front_vue3"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm font-mono border border-black/20 px-4 py-2 rounded-md hover:border-black/10 hover:bg-white transition"
      >
        github link for clone
      </a>

      <!-- Author -->
      <span class="text-xs text-gray-400 font-mono">
        @Kung Norasmey
      </span>

    </div>

  </div>
</template>
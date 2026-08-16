/*
|--------------------------------------------------------------------------
| File: NotFound.vue
|--------------------------------------------------------------------------
|
| Description:
| Minimal 404 page for unknown routes.
|
| Goals:
| - Keep UI simple and distraction-free
| - Provide clear message + single action
|
*/

<template>
  <!-- Centered container -->
  <div class="min-h-screen flex items-center justify-center bg-white px-6">

    <div class="text-center max-w-md">

      <!-- Code -->
      <h1 class="text-5xl font-semibold text-black">
        404
      </h1>

      <!-- Message -->
      <p class="mt-4 text-gray-500 text-sm leading-relaxed">
        Page not found. The route you are looking for does not exist.
      </p>

      <!-- Action -->
      <div class="mt-6">
        <RouterLink
          to="/preview"
          class="text-sm font-medium text-black hover:underline underline-offset-4"
        >
          Go back to preview
        </RouterLink>
      </div>

    </div>

  </div>
</template>
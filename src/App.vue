/*
|--------------------------------------------------------------------------
| File: App.vue
|--------------------------------------------------------------------------
|
| Description:
| Root component of the application.
| Acts as the main app shell and renders the active route view.
|
| Responsibilities:
| - Provide a single mounting point for the app
| - Render current route via Vue Router
| - Serve as a base for global layouts or providers
|
| Notes:
| - Layout wrappers (e.g., AppLayout, LandingLayout) are handled at route level
| - Keep this file minimal and free of business logic
|
*/

<template>
  <!-- Router outlet: renders matched route component -->
  <RouterView />
</template>
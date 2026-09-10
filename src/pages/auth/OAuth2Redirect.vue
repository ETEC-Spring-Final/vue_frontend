<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import useAuthStore from "@/stores/auth.store";

const route = useRoute();
const router = useRouter();
const { login, defaultRedirect } = useAuthStore();

const error = ref("");

/**
 * Decode a JWT's payload (base64url) without verifying the signature —
 * verification already happened on the backend; we're just reading the
 * claims it put there (subject = email, plus id and role, per the Agent
 * Guide: "Tokens carry subject = email plus id and role claims").
 */
function decodeJwtPayload(token) {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Malformed token");
  // base64url -> base64
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const json = decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
  return JSON.parse(json);
}

onMounted(() => {
  const token = route.query.token;

  if (!token || typeof token !== "string") {
    error.value = "No token was returned from Google sign-in.";
    return;
  }

  try {
    const claims = decodeJwtPayload(token);
    // Common claim names: `sub` is the JWT standard subject claim (email,
    // per the backend's JwtUtil), plus custom `id` and `role` claims.
    const email = claims.sub ?? claims.email;
    const id = claims.id;
    const role = claims.role;

    if (!email || !id || !role) {
      throw new Error("Token is missing expected claims (id/email/role).");
    }

    login({ id, email, role, token });
    router.replace(defaultRedirect());
  } catch (e) {
    error.value =
      "Could not complete sign-in. Please try logging in again.";
  }
});
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <template v-if="error">
      <div class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ error }}
      </div>
      <button
        type="button"
        class="mt-4 rounded-full bg-[#3D5FE0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3350C0]"
        @click="router.push('/login')"
      >
        Back to login
      </button>
    </template>
    <template v-else>
      <p class="text-sm text-[#6B7280]">Signing you in…</p>
    </template>
  </div>
</template>
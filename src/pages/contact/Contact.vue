<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <!-- Left: info -->
        <div class="lg:col-span-2">
          <p class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--color-primary)' }">Contact</p>
          <h1 class="mt-2 text-3xl font-bold sm:text-4xl" :style="{ color: 'var(--color-text)' }">Got a question? Reach out</h1>
          <p class="mt-3 text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
            Our team is ready to help with any question about a booking — typically replying within a day.
          </p>

          <div class="mt-4 flex items-center gap-2 text-xs font-medium" :style="{ color: '#22C55E' }">
            <span class="h-2 w-2 rounded-full bg-current"></span>
            Average response time: within 24 hours
          </div>

          <div class="mt-6 space-y-4">
            <div v-for="item in contactInfo" :key="item.label" class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                :style="{ backgroundColor: 'var(--color-primary-light)', border: '1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)' }"
              >
                <component :is="item.icon" class="h-4.5 w-4.5" :style="{ color: 'var(--color-primary)' }" />
              </div>
              <div>
                <p class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ item.label }}</p>
                <p class="mt-0.5 text-sm font-medium" :style="{ color: 'var(--color-text)' }">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <p class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">Follow us</p>
            <div class="mt-2 flex gap-2">
              <a
                v-for="s in socials" :key="s.label" :href="s.href" target="_blank" rel="noopener"
                class="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
                :aria-label="s.label"
              >
                <component :is="s.icon" class="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <!-- Right: form -->
        <form class="space-y-5 lg:col-span-3" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">Name</span>
              <input
                v-model="form.name" required placeholder="e.g. Sokha Chan"
                class="mt-1.5 w-full rounded-full px-5 py-3.5 text-sm outline-none transition-all duration-200 focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              />
            </label>
            <label class="block">
              <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">Email</span>
              <input
                v-model="form.email" type="email" required placeholder="you@example.com"
                class="mt-1.5 w-full rounded-full px-5 py-3.5 text-sm outline-none transition-all duration-200 focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              />
            </label>
          </div>

          <label class="block">
            <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">Subject</span>
            <input
              v-model="form.subject" placeholder="How can we help?"
              class="mt-1.5 w-full rounded-full px-5 py-3.5 text-sm outline-none transition-all duration-200 focus:shadow-sm"
              :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
            />
          </label>

          <label class="block">
            <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">Message</span>
            <textarea
              v-model="form.message" rows="6" required placeholder="Tell us a bit about your booking or question…"
              class="mt-1.5 w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-all duration-200 focus:shadow-sm"
              :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
            ></textarea>
          </label>

          <Transition name="fade">
            <p v-if="submitted" class="flex items-center gap-2 text-sm font-medium" :style="{ color: 'var(--color-primary)' }">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 12l6 6L20 6"/></svg>
              Thanks — we've received your message and will reply soon.
            </p>
          </Transition>

          <button
            type="submit" :disabled="submitting"
            class="w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            :style="{ background: 'linear-gradient(120deg, var(--color-primary), var(--color-primary-hover))' }"
          >
            {{ submitting ? 'Sending…' : 'Send message' }}
          </button>
        </form>
      </div>

      <!-- Map -->
      <h2 class="mt-16 text-lg font-bold" :style="{ color: 'var(--color-text)' }">Find us</h2>
      <div class="mt-4 overflow-hidden rounded-2xl border" :style="{ borderColor: 'var(--color-border)' }">
        <iframe
          title="Office location"
          class="h-72 w-full grayscale-[15%]"
          style="border:0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          :src="mapEmbedUrl"
        ></iframe>
      </div>

      <!-- FAQ -->
      <h2 class="mt-16 text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">Frequently asked questions</h2>
      <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">Quick answers before you reach out</p>
      <div class="mx-auto mt-6 max-w-2xl space-y-2">
        <div v-for="(faq, i) in faqs" :key="faq.q" class="overflow-hidden rounded-2xl border" :style="{ borderColor: 'var(--color-border)' }">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors duration-200"
            :style="{ color: 'var(--color-text)' }"
            @click="openFaq = openFaq === i ? -1 : i"
          >
            {{ faq.q }}
            <svg
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              class="h-4 w-4 shrink-0 transition-transform duration-200" :style="{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)' }"
            >
              <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <Transition name="collapse">
            <p v-if="openFaq === i" class="px-5 pb-4 text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
              {{ faq.a }}
            </p>
          </Transition>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, h, ref } from 'vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import useSiteSettingsStore from '@/stores/siteSettings.store'
import { useSocialLinks } from '@/composables/useSocialLinks'
// import contactApi from '@/services/contact' // wire this up once a backend endpoint exists

const { state: siteSettings } = useSiteSettingsStore()

const form = ref({ name: '', email: '', subject: '', message: '' })
const submitting = ref(false)
const submitted = ref(false)
const openFaq = ref(0)

const icon = (path) => ({ render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none' }, [h('path', { stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: path })]) })

const contactInfo = computed(() => [
  { label: 'Phone', value: siteSettings.contactPhone || '—', icon: icon('M4 5h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2C10 22 2 14 2 7a2 2 0 0 1 2-2Z') },
  { label: 'Email', value: siteSettings.contactEmail || '—', icon: icon('M3 6h18v12H3V6Zm0 0 9 7 9-7') },
  { label: 'Office', value: siteSettings.address || 'Phnom Penh, Cambodia', icon: icon('M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11Zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z') },
])

// FIX: pull from siteSettings via the shared composable (same one
// SiteFooter uses) instead of the hardcoded href:'#' placeholders. An
// admin who hasn't filled in a platform simply won't see that icon here.
const socials = useSocialLinks()

const mapEmbedUrl = computed(() => {
  const q = encodeURIComponent(siteSettings.address || 'Phnom Penh, Cambodia')
  return `https://www.google.com/maps?q=${q}&output=embed`
})

const faqs = [
  { q: 'How do I book a vehicle?', a: 'Browse the fleet, pick your dates and locations on the vehicle page, then confirm — a JWT-authenticated account is required to complete a reservation.' },
  { q: 'Can I cancel a reservation?', a: 'Yes, from My Reservations, as long as it is still Pending or Confirmed. Completed or already-cancelled reservations can\'t be cancelled again.' },
  { q: 'What documents do I need to upload?', a: 'Once your rental starts, head to My Rentals to upload any required documents (ID, license) directly against that rental.' },
  { q: 'How do I pay an invoice?', a: 'Open the invoice from My Invoices and use "Pay with Bakong" — scan the generated QR code with your banking app.' },
]

async function onSubmit() {
  submitting.value = true
  submitted.value = false
  await new Promise((r) => setTimeout(r, 600))
  submitting.value = false
  submitted.value = true
  form.value = { name: '', email: '', subject: '', message: '' }
}
</script>

<style scoped>
@keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-page-in { animation: page-in 0.35s ease-out; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.2s ease; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { opacity: 0; max-height: 0; }
.collapse-enter-to, .collapse-leave-from { opacity: 1; max-height: 200px; }
</style>
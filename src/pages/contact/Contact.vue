<template>
  <div class="min-h-screen transition-colors duration-300" :style="{ backgroundColor: 'var(--color-bg)' }">
    <SiteHeader />

    <div class="mx-auto max-w-6xl animate-page-in px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <!-- Left: info -->
        <div class="lg:col-span-2">
          <p class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--color-primary)' }">{{ $t('contact.eyebrow') }}</p>
          <h1 class="mt-2 text-3xl font-bold sm:text-4xl" :style="{ color: 'var(--color-text)' }">{{ $t('contact.title') }}</h1>
          <p class="mt-3 text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
            {{ $t('contact.intro') }}
          </p>

          <div class="mt-4 flex items-center gap-2 text-xs font-medium" :style="{ color: '#22C55E' }">
            <span class="h-2 w-2 rounded-full bg-current"></span>
            {{ $t('contact.responseTime') }}
          </div>

          <div class="mt-6 space-y-4">
            <div v-for="item in contactInfo" :key="item.labelKey" class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                :style="{ backgroundColor: 'var(--color-primary-light)', border: '1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)' }"
              >
                <component :is="item.icon" class="h-4.5 w-4.5" :style="{ color: 'var(--color-primary)' }" />
              </div>
              <div>
                <p class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t(item.labelKey) }}</p>
                <p class="mt-0.5 text-sm font-medium" :style="{ color: 'var(--color-text)' }">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <p class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('contact.followUs') }}</p>
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
              <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('contact.name') }}</span>
              <input
                v-model="form.name" required :placeholder="$t('contact.namePlaceholder')"
                class="mt-1.5 w-full rounded-full px-5 py-3.5 text-sm outline-none placeholder:text-[var(--color-text-secondary)] transition-all duration-200 focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              />
            </label>
            <label class="block">
              <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('contact.email') }}</span>
              <input
                v-model="form.email" type="email" required :placeholder="$t('contact.emailPlaceholder')"
                class="mt-1.5 w-full rounded-full px-5 py-3.5 text-sm outline-none placeholder:text-[var(--color-text-secondary)] transition-all duration-200 focus:shadow-sm"
                :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
              />
            </label>
          </div>

          <label class="block">
            <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('contact.subject') }}</span>
            <input
              v-model="form.subject" :placeholder="$t('contact.subjectPlaceholder')"
              class="mt-1.5 w-full rounded-full px-5 py-3.5 text-sm outline-none placeholder:text-[var(--color-text-secondary)] transition-all duration-200 focus:shadow-sm"
              :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
            />
          </label>

          <label class="block">
            <span class="text-xs font-semibold uppercase" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('contact.message') }}</span>
            <textarea
              v-model="form.message" rows="6" required :placeholder="$t('contact.messagePlaceholder')"
              class="mt-1.5 w-full rounded-2xl px-5 py-3.5 text-sm outline-none placeholder:text-[var(--color-text-secondary)] transition-all duration-200 focus:shadow-sm"
              :style="{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }"
            ></textarea>
          </label>

          <Transition name="fade">
            <p v-if="submitted" class="flex items-center gap-2 text-sm font-medium" :style="{ color: 'var(--color-primary)' }">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-4 w-4"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 12l6 6L20 6"/></svg>
              {{ $t('contact.thanks') }}
            </p>
          </Transition>

          <button
            type="submit" :disabled="submitting"
            class="w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            :style="{ background: 'linear-gradient(120deg, var(--color-primary), var(--color-primary-hover))' }"
          >
            {{ submitting ? $t('contact.sending') : $t('contact.send') }}
          </button>
        </form>
      </div>

      <!-- Map -->
      <h2 class="mt-16 text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('contact.findUs') }}</h2>
      <div class="mt-4 overflow-hidden rounded-2xl border" :style="{ borderColor: 'var(--color-border)' }">
        <iframe
          :title="$t('contact.mapTitle')"
          class="h-72 w-full grayscale-[15%]"
          style="border:0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          :src="mapEmbedUrl"
        ></iframe>
      </div>

      <!-- FAQ -->
      <h2 class="mt-16 text-center text-lg font-bold" :style="{ color: 'var(--color-text)' }">{{ $t('contact.faqTitle') }}</h2>
      <p class="mt-1 text-center text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ $t('contact.faqSubtitle') }}</p>
      <div class="mx-auto mt-6 max-w-2xl space-y-2">
        <div v-for="(faq, i) in faqs" :key="faq.qKey" class="overflow-hidden rounded-2xl border" :style="{ borderColor: 'var(--color-border)' }">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors duration-200"
            :style="{ color: 'var(--color-text)' }"
            @click="openFaq = openFaq === i ? -1 : i"
          >
            {{ $t(faq.qKey) }}
            <svg
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              class="h-4 w-4 shrink-0 transition-transform duration-200" :style="{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)' }"
            >
              <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <Transition name="collapse">
            <p v-if="openFaq === i" class="px-5 pb-4 text-sm leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">
              {{ $t(faq.aKey) }}
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
  { labelKey: 'contact.phoneLabel', value: siteSettings.contactPhone || '—', icon: icon('M4 5h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2C10 22 2 14 2 7a2 2 0 0 1 2-2Z') },
  { labelKey: 'contact.emailLabel', value: siteSettings.contactEmail || '—', icon: icon('M3 6h18v12H3V6Zm0 0 9 7 9-7') },
  { labelKey: 'contact.officeLabel', value: siteSettings.address || 'Phnom Penh, Cambodia', icon: icon('M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11Zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z') },
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
  { qKey: 'contact.faq1q', aKey: 'contact.faq1a' },
  { qKey: 'contact.faq2q', aKey: 'contact.faq2a' },
  { qKey: 'contact.faq3q', aKey: 'contact.faq3a' },
  { qKey: 'contact.faq4q', aKey: 'contact.faq4a' },
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
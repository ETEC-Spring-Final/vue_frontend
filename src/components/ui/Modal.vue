<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm"
        @click.self="closeOnBackdrop && $emit('close')"
      >
        <Transition name="modal-pop" appear>
          <div
            v-if="open"
            class="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl"
            style="background-color: var(--color-surface); max-height: 90vh;"
          >
            <!-- Header (fixed) -->
            <div
              class="flex shrink-0 items-center justify-between border-b px-6 py-4"
              style="border-color: var(--color-border);"
            >
              <h2 class="text-lg font-bold" style="color: var(--color-text);">{{ title }}</h2>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:rotate-90 hover:bg-[var(--color-primary-light)] active:scale-90"
                style="color: var(--color-text-secondary);"
                :aria-label="t('common.close')"
                @click="$emit('close')"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body (scrollable). The listeners below only watch for typing / submitting
                 so the draft logic knows what to keep. They never change behaviour. -->
            <div
              ref="bodyRef"
              class="flex-1 overflow-y-auto px-6 py-4"
              @submit.capture="onSubmitted"
              @input="onEdited"
              @change="onEdited"
            >
              <slot />
            </div>

            <!-- Footer (fixed, optional) -->
            <div
              v-if="$slots.footer"
              class="shrink-0 border-t px-6 py-4"
              style="border-color: var(--color-border);"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
// Module scope (shared by every <Modal>): unsaved "Add" form drafts, kept in memory
// for the whole SPA session. Key = page path + modal title.
const drafts = new Map()
</script>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  open: Boolean,
  title: String,
  // Default false: clicking/touching outside the modal (or dragging a text
  // selection out of an input) must not close it and wipe what the admin is
  // typing. The modal closes only via the X button or the Cancel button.
  // Pass :close-on-backdrop="true" on a specific <Modal> to opt back in.
  closeOnBackdrop: { type: Boolean, default: false },
  // Keeps what was typed in an EMPTY ("Add") form when the modal is closed without
  // saving, and puts it back the next time the same modal opens empty.
  // Pass :persist-draft="false" on a specific <Modal> to turn this off.
  persistDraft: { type: Boolean, default: true },
})
defineEmits(['close'])

// ---------------------------------------------------------------------------
// Draft keeping. Works purely on the form controls inside the modal body, so no
// page has to change: pages keep resetting their own form as they do today, and
// the modal puts the unsaved values back right after it opens.
//
//  - Only "blank" forms are kept (every text/number/textarea is empty or 0).
//    A form pre-filled by an Edit button is never kept or restored, so editing
//    vehicle B can never show text typed for vehicle A.
//  - A draft is only restored if the form opened in exactly the same blank state
//    it had when the draft was saved.
//  - If the form was submitted (and not edited again) before closing, the draft
//    is dropped, so a saved record does not come back as a draft.
//  - Password, file and hidden fields are never stored. Add data-no-draft to any
//    other field you want left out.
// ---------------------------------------------------------------------------
const bodyRef = ref(null)

let activeKey = null
let pristine = null
let submitted = false
let restoring = false

const SKIPPED_TYPES = ['file', 'password', 'hidden', 'button', 'submit', 'reset', 'image']
const TEXT_KINDS = ['input:text', 'input:number', 'input:email', 'input:tel', 'input:url', 'input:search', 'textarea']

function collectFields(root) {
  if (!root) return []
  return Array.from(root.querySelectorAll('input, select, textarea')).filter((el) => {
    if (el.hasAttribute('data-no-draft')) return false
    if (el.tagName === 'INPUT' && SKIPPED_TYPES.includes(el.type)) return false
    return true
  })
}

function readField(el) {
  const kind = el.tagName === 'INPUT' ? `input:${el.type}` : el.tagName.toLowerCase()
  const isToggle = el.type === 'checkbox' || el.type === 'radio'
  return { kind, value: isToggle ? el.checked : el.value }
}

function sameSnapshot(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function isBlank(snapshot) {
  const textual = snapshot.filter((f) => TEXT_KINDS.includes(f.kind))
  return textual.length > 0 && textual.every((f) => f.value === '' || f.value === '0')
}

function draftKey() {
  return `${window.location.pathname}::${props.title ?? ''}`
}

function fire(el, type) {
  el.dispatchEvent(new Event(type, { bubbles: true }))
}

function restore(fields, saved) {
  restoring = true
  try {
    fields.forEach((el, i) => {
      const field = saved[i]
      if (!field) return
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = field.value
      } else if (el.tagName === 'SELECT') {
        // Skip if that option no longer exists (e.g. a list that has changed).
        if (!Array.from(el.options).some((o) => o.value === field.value)) return
        el.value = field.value
      } else {
        el.value = field.value
      }
      // Tell Vue's v-model about the change (text inputs listen to "input",
      // selects/checkboxes to "change").
      fire(el, 'input')
      fire(el, 'change')
    })
  } finally {
    restoring = false
  }
}

async function onOpened() {
  if (!props.persistDraft) return
  // Wait for the modal body and the page's own initial form values to be rendered.
  await nextTick()
  const fields = collectFields(bodyRef.value)
  if (fields.length === 0) return

  activeKey = draftKey()
  pristine = fields.map(readField)
  submitted = false

  if (!isBlank(pristine)) {
    // Pre-filled form (Edit): never keep or restore drafts for it.
    activeKey = null
    return
  }

  const draft = drafts.get(activeKey)
  if (draft && sameSnapshot(draft.pristine, pristine)) {
    restore(fields, draft.current)
  }
}

function onClosing() {
  if (!props.persistDraft || !activeKey) return
  if (submitted) {
    drafts.delete(activeKey)
  } else {
    const current = collectFields(bodyRef.value).map(readField)
    if (current.length === 0 || sameSnapshot(current, pristine)) {
      drafts.delete(activeKey) // nothing typed
    } else {
      drafts.set(activeKey, { pristine, current })
    }
  }
  activeKey = null
}

function onSubmitted() {
  // The browser only fires "submit" when required-field validation passed.
  submitted = true
}

function onEdited(e) {
  if (restoring || e.target?.type === 'file') return
  submitted = false
}

watch(
  () => props.open,
  (isOpen) => (isOpen ? onOpened() : onClosing())
)
onMounted(() => {
  if (props.open) onOpened()
})
onBeforeUnmount(() => {
  if (props.open) onClosing()
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-pop-enter-active {
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(12px);
}
</style>
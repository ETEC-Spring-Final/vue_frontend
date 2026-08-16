import { ref } from 'vue'

export default function useFetch(url) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const run = async (options) => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(url, options)
      data.value = await res.json()
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, run }
}

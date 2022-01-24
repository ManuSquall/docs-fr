import { Header, useRoute } from 'vitepress'
import { computed, onMounted, onUnmounted, Ref, ref, ToRefs, toRefs } from 'vue'

const hasStorage = typeof localStorage !== 'undefined'
const get = (key: string, defaultValue = false): boolean =>
  hasStorage
    ? JSON.parse(localStorage.getItem(key) || String(defaultValue))
    : defaultValue

export const preferCompositionKey = 'vue-docs-prefer-composition'
export const preferComposition = ref(get(preferCompositionKey))

export const preferSFCKey = 'vue-docs-prefer-sfc'
export const preferSFC = ref(get(preferSFCKey, true))

export function filterHeadersByPreference(headers: Header[]) {
  const enableComp = preferComposition.value
  return headers.filter((h) => {
    return enableComp ? !h.optionsOnly : !h.compositionOnly
  })
}

const isMac = /(Mac OS X)/i.test(globalThis.navigator?.userAgent);

export function usePreferences() {
  const route = useRoute()
  const showPreference = computed(() =>
    /^\/(guide|tutorial|examples)\//.test(route.path)
  )
  const showSFC = computed(() => !/^\/guide/.test(route.path))
  const isOpen = ref(
    typeof localStorage !== 'undefined' &&
    !localStorage.getItem(preferCompositionKey)
  )

  const toggleOpen = () => {
    isOpen.value = !isOpen.value
  }

  const toggleCompositionAPI = useToggleFn(
    preferCompositionKey,
    preferComposition,
    'prefer-composition'
  )
  const toggleSFC = useToggleFn(preferSFCKey, preferSFC, 'prefer-sfc')

  function useToggleFn(
    storageKey: string,
    state: Ref<boolean>,
    className: string
  ) {
    if (typeof localStorage === 'undefined') {
      return () => { }
    }
    const classList = document.documentElement.classList
    return (value = !state.value) => {
      if ((state.value = value)) {
        classList.add(className)
      } else {
        classList.remove(className)
      }
      localStorage.setItem(storageKey, String(state.value))
    }
  }

  let closeTimeout: any
  const onPreferenceKeyupChange = (callback: Function) => {
    const alreadyOpen = isOpen.value
    clearTimeout(closeTimeout)
    if (alreadyOpen === false) {
      isOpen.value = true // Open preference to see what is changed.
      setTimeout(() => {
        callback()
        closeTimeout = setTimeout(() => {
          // Close after 5 seconds
          isOpen.value = false;
        }, 5000)
      }, 150)
    } else {
      callback()
    }
  }

  const preferenceKeyupHandler = (e: KeyboardEvent) => {
    if (e.altKey && e.ctrlKey && showPreference.value) {
      if (e.key === 'a') { // Ctrl+Alt+A + preference switch available
        onPreferenceKeyupChange(toggleCompositionAPI)
      } else if (e.key === 't' && showSFC.value) { // Ctrl+Alt+T + sfc option available
        onPreferenceKeyupChange(toggleSFC)
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keyup', preferenceKeyupHandler)
  })
  onUnmounted(() => {
    document.removeEventListener('keyup', preferenceKeyupHandler)
  })

  const shortcutInfo = computed(() => {
    const templateInfo = showSFC.value ? `\nCtrl+${isMac ? 'Option' : 'Alt'}+T: toggle template preference` : ''

    return `Ctrl+${isMac ? 'Option' : 'Alt'}+A: toggle API preference${templateInfo}`
  })

  return {
    isOpen,
    shortcutInfo,
    showPreference,
    showSFC,
    toggleOpen,
    toggleCompositionAPI,
    toggleSFC,
  }
}
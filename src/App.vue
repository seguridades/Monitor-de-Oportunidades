<script setup>
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()
</script>

<template>
  <RouterView />
  <Toaster position="bottom-right" :theme="ui.theme" closeButton />
</template>

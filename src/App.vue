<template>
  <div class="min-h-screen w-full m-0 p-0">
    <ErrorHandler :errors="errors" :on-close="clearError" />
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { useErrorHandler } from "./composables/useErrorHandler";

import ErrorHandler from "./components/common/ErrorHandler.vue";

const { errors, clearError } = useErrorHandler();
</script>

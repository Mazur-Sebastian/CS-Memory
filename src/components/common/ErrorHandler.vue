<template>
  <div class="error-container">
    <transition-group name="slide" tag="div">
      <div
        v-for="error in errors"
        :key="error.id"
        class="error-toast"
        :class="getTypeStyles(error.type)"
      >
        <div class="error-message">{{ error.message }}</div>
        <button class="close-button" @click="clearError(error.id)">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useErrorHandler } from "../../composables/useErrorHandler";

interface ErrorMessage {
  id: string;
  message: string;
  type?: "error" | "warning" | "info";
  duration?: number;
}

const { errors, clearError } = useErrorHandler();

const getTypeStyles = (type: ErrorMessage["type"]) => {
  switch (type) {
    case "error":
      return "bg-red-900 border-red-500 text-white";
    case "warning":
      return "bg-yellow-900 border-yellow-500 text-white";
    case "info":
    default:
      return "bg-gray-800 border-[#3281ac] text-white";
  }
};
</script>

<style scoped>
.error-container {
  @apply fixed top-4 right-4 z-50 flex flex-col gap-2;
}

.error-toast {
  @apply flex items-center justify-between p-4 rounded-[2px] shadow-lg min-w-[250px] max-w-[400px] font-semibold text-sm;
  border-width: 2px;
}

.error-message {
  @apply flex-1;
}

.close-button {
  @apply ml-4 text-white hover:text-[#3281ac] transition-colors bg-transparent border-none cursor-pointer;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

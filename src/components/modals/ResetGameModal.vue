<template>
  <div class="modal">
    <div class="modal-content">
      <h2 class="modal-title">Congratulations!</h2>
      <p class="modal-text">You completed the game!</p>
      <p class="modal-text">Moves: {{ moves }} | Time: {{ formattedTime }}</p>
      <div class="modal-actions">
        <CSButton @click="$emit('resetGame')" class="button"
          >Play again</CSButton
        >
        <CSButton @click="$emit('goToMenu')" class="button"
          >Back to menu</CSButton
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CSButton from "../common/CSButton.vue";

type Props = {
  moves: number;
  formattedTime: string;
};

type Emits = {
  resetGame: () => void;
  goToMenu: () => void;
};

defineProps<Props>();
defineEmits<Emits>();
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Anton&Oswald:wght@400&display=swap");

.modal {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-sm text-center;
}

.modal-title {
  @apply text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-4;
  font-family: "Anton", sans-serif;
}

.modal-text {
  @apply text-sm sm:text-base text-gray-300 mb-2 sm:mb-4;
  font-family: "Oswald", sans-serif;
}

.modal-actions {
  @apply flex flex-col sm:flex-row justify-center gap-2 sm:gap-4;
}
</style>

<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 pt-0 w-full"
  >
    <div class="jumbotron">
      <h1 class="title">Memory Game CS2</h1>
    </div>
    <div class="options">
      <CSButton @click="startGame(4)" class="button">Easy (4x4)</CSButton>
      <CSButton @click="startGame(6)" class="button">Medium (6x6)</CSButton>
      <CSButton @click="startGame(8)" class="button">Hard (8x8)</CSButton>
    </div>
    <div class="seed-input">
      <input
        v-model="seed"
        type="text"
        placeholder="Enter seed (e.g. 4x4_custom123)"
        class="input"
      />
      <CSButton @click="startGame()" class="button">Start with seed</CSButton>
    </div>
    <router-link to="/history" class="history-link">Game history</router-link>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import { useSeed } from "../composables/useSeed";

import CSButton from "../components/common/CSButton.vue";

const router = useRouter();
const { seed, generateRandomSeed } = useSeed();

const startGame = (gridSize?: number) => {
  const inputSeed = seed.value.trim();
  const inputSeedMatched = inputSeed.match(/^(4x4|6x6|8x8)_(.+)$/);
  const gameSeed = gridSize
    ? generateRandomSeed(gridSize)
    : inputSeedMatched
    ? inputSeed
    : generateRandomSeed(4);

  if (gridSize || !inputSeedMatched) {
    seed.value = "";
  }

  router.push(`/game/${gameSeed}`);
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Anton&Oswald:wght@400&display=swap");

.jumbotron {
  @apply w-full bg-white flex items-center justify-center rounded-none shadow-2xl mb-6 sm:mb-8 p-6 sm:p-8 text-center fixed top-0 left-0;
  background: linear-gradient(-30deg, #d97706 66.67%, white 66.67%);
}

.title {
  @apply text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight;
  font-family: "Anton", sans-serif;
}

.options {
  @apply flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 mt-24 sm:mt-32;
}

.seed-input {
  @apply flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full max-w-xs sm:max-w-sm;
}

.input {
  @apply bg-gray-800 border-2 border-gray-600 rounded-md px-3 py-2 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-[#d97706];
}

.history-link {
  @apply text-[#d97706] hover:text-[#b86005] text-sm sm:text-base font-semibold transition-colors;
}
</style>

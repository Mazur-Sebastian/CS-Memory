<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const seed = ref<string>("");

const generateRandomSeed = (gridSize: number): string => {
  const randomNum = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0");
  return `${gridSize}x${gridSize}_${randomNum}`;
};

const startGame = (gridSize?: number) => {
  let gameSeed = seed.value.trim();
  if (gridSize) {
    gameSeed = generateRandomSeed(gridSize);
    seed.value = "";
  }
  if (!gameSeed.match(/^(4x4|6x6|8x8)_(.+)$/)) {
    gameSeed = generateRandomSeed(4);
    seed.value = "";
  }
  router.push(`/game/${gameSeed}`);
};
</script>

<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 pt-0 w-full"
  >
    <div class="jumbotron">
      <h1 class="title">Memory Game CS2</h1>
    </div>
    <div class="options">
      <button @click="startGame(4)" class="button">Łatwy (4x4)</button>
      <button @click="startGame(6)" class="button">Średni (6x6)</button>
      <button @click="startGame(8)" class="button">Trudny (8x8)</button>
    </div>
    <div class="seed-input">
      <input
        v-model="seed"
        type="text"
        placeholder="Wpisz seed (np. 4x4_custom123)"
        class="input"
      />
      <button @click="startGame()" class="button">Start z seedem</button>
    </div>
    <router-link to="/history" class="history-link">Historia gier</router-link>
  </div>
</template>

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

.button {
  @apply text-white px-4 py-2 hover:bg-[#2a6b94] transition-colors text-sm sm:text-base font-semibold;
  background-color: rgb(50, 129, 172);
  border-radius: 2px;
  font-family: "Oswald", sans-serif;
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

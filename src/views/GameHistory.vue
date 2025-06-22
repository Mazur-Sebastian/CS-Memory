<template>
  <div
    class="flex flex-col items-center min-h-screen bg-gray-900 p-4 pt-0 w-full"
  >
    <div class="jumbotron">
      <h1 class="title">Game History</h1>
    </div>
    <div v-if="gameHistory.length === 0" class="empty-message">
      No saved games
    </div>
    <div v-else class="history-table">
      <table class="history-table-table">
        <thead>
          <tr>
            <th class="history-table-th">Seed</th>
            <th class="history-table-th">Difficulty</th>
            <th class="history-table-th">Moves</th>
            <th class="history-table-th">Time</th>
            <th class="history-table-th">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="game in gameHistory"
            :key="game.seed"
            class="history-table-tr"
          >
            <td class="history-table-td">{{ game.seed }}</td>
            <td class="history-table-td">{{ game.difficulty }}</td>
            <td class="history-table-td">{{ game.moves }}</td>
            <td class="history-table-td">{{ formatTime(game.time) }}</td>
            <td class="history-table-td">{{ formatDate(game.date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <CSButton @click="router.push('/')">Back to menu</CSButton>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import { useDateFormat } from "../composables/useDateFormat";

import CSButton from "../components/common/CSButton.vue";
import { useGameHistory } from "../composables/useGameHistory";

const router = useRouter();
const { formatDate, formatTime } = useDateFormat();
const { gameHistory, loadGameHistory } = useGameHistory();

onMounted(() => {
  loadGameHistory();
});
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

.empty-message {
  @apply text-base sm:text-lg font-semibold text-white mt-24 sm:mt-32;
  font-family: "Oswald", sans-serif;
}

.history-table {
  @apply w-full max-w-4xl mb-6 mt-24 sm:mt-32;
}

.history-table-table {
  @apply w-full border-collapse bg-gray-800 text-white shadow-md rounded-lg;
}

.history-table-th,
.history-table-td {
  @apply border border-gray-600 px-3 py-2 text-sm sm:text-base;
  font-family: "Oswald", sans-serif;
}

.history-table-th {
  @apply bg-[#2a6b94] font-semibold;
}

.history-table-tr:nth-child(even) {
  @apply bg-gray-700;
}
</style>

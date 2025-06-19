<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

interface GameRecord {
  seed: string;
  moves: number;
  time: number;
  difficulty: string;
  date: string;
}

const router = useRouter();
const gameHistory = ref<GameRecord[]>([]);

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
};

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const loadGameHistory = () => {
  try {
    const history = JSON.parse(
      localStorage.getItem("memoryGameHistory") || "[]"
    );
    gameHistory.value = history.sort(
      (a: GameRecord, b: GameRecord) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (e) {
    console.warn("Błąd podczas ładowania historii gier:", e);
    gameHistory.value = [];
  }
};

onMounted(() => {
  loadGameHistory();
});
</script>

<template>
  <div
    class="flex flex-col items-center min-h-screen bg-gray-900 p-4 pt-0 w-full"
  >
    <div class="jumbotron">
      <h1 class="title">Historia gier</h1>
    </div>
    <div v-if="gameHistory.length === 0" class="empty-message">
      Brak zapisanych gier
    </div>
    <div v-else class="history-table">
      <table>
        <thead>
          <tr>
            <th>Seed</th>
            <th>Poziom trudności</th>
            <th>Ruchy</th>
            <th>Czas</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="game in gameHistory" :key="game.seed">
            <td>{{ game.seed }}</td>
            <td>{{ game.difficulty }}</td>
            <td>{{ game.moves }}</td>
            <td>{{ formatTime(game.time) }}</td>
            <td>{{ formatDate(game.date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <button @click="router.push('/')" class="button">Wróć do menu</button>
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

.empty-message {
  @apply text-base sm:text-lg font-semibold text-white mt-24 sm:mt-32;
  font-family: "Oswald", sans-serif;
}

.history-table {
  @apply w-full max-w-4xl mb-6 mt-24 sm:mt-32;
}

table {
  @apply w-full border-collapse bg-gray-800 text-white shadow-md rounded-lg;
}

th,
td {
  @apply border border-gray-600 px-3 py-2 text-sm sm:text-base;
  font-family: "Oswald", sans-serif;
}

th {
  @apply bg-[#2a6b94] font-semibold;
}

tbody tr:nth-child(even) {
  @apply bg-gray-700;
}

.button {
  @apply text-white px-6 py-3 hover:bg-[#2a6b94] transition-colors text-sm sm:text-base font-semibold;
  background-color: rgb(50, 129, 172);
  border-radius: 2px;
  font-family: "Oswald", sans-serif;
}
</style>

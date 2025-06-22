<template>
  <div class="container">
    <div class="info-bar">
      <div class="seed-display">Seed: {{ props.seed }}</div>
      <div class="stats">Moves: {{ moves }} | Time: {{ formattedTime }}</div>
      <CSButton @click="resetGame" class="button">Reset game</CSButton>
    </div>
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <ResetGameModal
      v-if="showModal"
      :moves="moves"
      :formattedTime="formattedTime"
      @resetGame="resetGame"
      @goToMenu="router.push('/')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRouter } from "vue-router";

import CSButton from "./common/CSButton.vue";
import ResetGameModal from "./modals/ResetGameModal.vue";

import { useGameStats } from "../composables/useGameStats";
import { useDateFormat } from "../composables/useDateFormat";

import type { Tile, Skin } from "../types/game";
import { useSeed } from "../composables/useSeed";
import { useGameMemory } from "../composables/useGameMemory";

const props = defineProps<{
  seed: string;
}>();

const router = useRouter();
const { saveGameState, loadGameState } = useGameStats();
const { formatTime } = useDateFormat();
const { parseSeed, seedHash } = useSeed();
const {
  tiles,
  moves,
  drawTiles,
  updateCanvasSize,
  updateTilesPosition,
  canvasClick,
  flippedTiles,
  touchMove,
  mouseMove,
  ctx,
} = useGameMemory();

const saveGameStateWithStats = () => {
  saveGameState({
    seed: props.seed,
    tiles: tiles.value,
    flippedTiles: flippedTiles.value,
    moves: moves.value,
    startTime: startTime.value,
    elapsedTime: elapsedTime.value,
  });
};

const { gridSize, layoutSeed } = parseSeed(props.seed);

const validGridSizes = [4, 6, 8];
if (!validGridSizes.includes(gridSize)) {
  router.push(`/game/4x4_${Date.now()}`);
}

const gameCanvas = ref<HTMLCanvasElement | null>(null);

const startTime = ref<number>(Date.now());
const elapsedTime = ref<number>(0);
const showModal = ref<boolean>(false);
const tileCount = gridSize * gridSize;

updateCanvasSize(gridSize, gameCanvas.value);

let timerInterval: number | null = null;
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime.value = Date.now() - startTime.value;
    saveGameStateWithStats();
  }, 1000);
};

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(elapsedTime.value / 1000);

  return formatTime(totalSeconds);
});

const resetGame = () => {
  localStorage.removeItem(`memoryGameState_${props.seed}`);
  moves.value = 0;
  startTime.value = Date.now();
  elapsedTime.value = 0;
  flippedTiles.value = [];
  showModal.value = false;
  initTiles();
  startTimer();
};

const shuffleArray = <T>(array: T[], seed: number): T[] => {
  const hashedSeed = seedHash(seed.toString());
  const rng = (max: number, state: number): number => {
    const a = 1664525;
    const c = 1013904223;
    state = (a * state + c) >>> 0;
    return state % max;
  };
  let state = hashedSeed;
  for (let i = array.length - 1; i > 0; i--) {
    const j = rng(i + 1, state);
    state = (1664525 * state + 1013904223) >>> 0;
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const fetchSkins = async (): Promise<Skin[]> => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json"
    );
    const skins: Skin[] = await response.json();
    return skins;
  } catch (error) {
    console.error("Błąd podczas pobierania skórek:", error);
    return [];
  }
};

const initTiles = async (): Promise<void> => {
  const savedState = loadGameState(props.seed);
  if (savedState) {
    tiles.value = savedState.tiles;
    flippedTiles.value = savedState.flippedTiles;
    moves.value = savedState.moves;
    startTime.value = savedState.startTime;
    elapsedTime.value = savedState.elapsedTime;
    updateCanvasSize(gridSize, gameCanvas.value);
    const imagePromises = tiles.value.map((tile) => {
      return new Promise<void>((resolve) => {
        if (tile.image.complete) {
          resolve();
        } else {
          tile.image.onload = () => resolve();
          tile.image.onerror = () => resolve();
        }
      });
    });
    await Promise.all(imagePromises);
    console.log("Inicjalizacja z zapisanego stanu:", {
      tiles: tiles.value.map((t) => ({
        flipped: t.flipped,
        matched: t.matched,
        flipProgress: t.flipProgress,
      })),
    });
    drawTiles(0);
    startTimer();
    return;
  }

  tiles.value = [];
  const skins = await fetchSkins();
  const skinCount = tileCount / 2;
  const selectedSkins = shuffleArray(skins, parseInt(layoutSeed)).slice(
    0,
    skinCount
  );
  const pairedSkins = [...selectedSkins, ...selectedSkins];
  const shuffledSkins = shuffleArray(pairedSkins, parseInt(layoutSeed));
  updateCanvasSize(gridSize, gameCanvas.value);

  const imagePromises: Promise<void>[] = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const skin = shuffledSkins[i * gridSize + j];
      const image = new Image();
      image.src = skin.image;
      tiles.value.push({
        x: 0,
        y: 0,
        skin,
        flipped: false,
        matched: false,
        image,
        flipProgress: 0,
      });
      imagePromises.push(
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
          } else {
            image.onload = () => resolve();
            image.onerror = () => resolve();
          }
        })
      );
    }
  }
  updateTilesPosition(gridSize);
  await Promise.all(imagePromises);
  saveGameStateWithStats();
  requestAnimationFrame(() => drawTiles(0));
  startTimer();
};

const handleMouseMove = (event: MouseEvent): void => {
  if (gameCanvas.value) {
    mouseMove(event, gameCanvas.value);
  }
};

const handleTouchMove = (event: TouchEvent): void => {
  if (gameCanvas.value && event.touches.length > 0) {
    touchMove(event, gameCanvas.value);
  }
};

watch(
  () => props.seed,
  async () => {
    const { gridSize: newGridSize } = parseSeed(props.seed);
    if (validGridSizes.includes(newGridSize)) {
      updateCanvasSize(gridSize, gameCanvas.value);
      await initTiles();
    } else {
      router.push(`/game/4x4_${Date.now()}`);
    }
  }
);

const handleCanvasClick = (event: MouseEvent | TouchEvent) => {
  if (gameCanvas.value && flippedTiles.value.length < 2 && !showModal.value) {
    canvasClick(
      event,
      gameCanvas.value,
      props.seed,
      startTime.value,
      elapsedTime.value,
      timerInterval,
      showModal
    );
  }
};

onMounted(() => {
  if (gameCanvas.value) {
    ctx = gameCanvas.value.getContext("2d");
    updateCanvasSize(gridSize, gameCanvas.value);
    initTiles();
    gameCanvas.value.addEventListener("click", handleCanvasClick);
    gameCanvas.value.addEventListener("mousemove", handleMouseMove);
    gameCanvas.value.addEventListener("touchstart", handleCanvasClick);
    gameCanvas.value.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("resize", () =>
      updateCanvasSize(gridSize, gameCanvas.value)
    );
  }
});

onUnmounted(() => {
  if (gameCanvas.value) {
    gameCanvas.value.removeEventListener("click", handleCanvasClick);
    gameCanvas.value.removeEventListener("mousemove", handleMouseMove);
    gameCanvas.value.removeEventListener("touchstart", handleCanvasClick);
    gameCanvas.value.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("resize", () =>
      updateCanvasSize(gridSize, gameCanvas.value)
    );
  }
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Anton&Oswald:wght@400&display=swap");

.container {
  @apply flex flex-col items-center min-h-screen bg-gray-900 p-4 w-full;
}

.info-bar {
  @apply flex flex-col sm:flex-row justify-between items-center w-full max-w-4xl mb-2 sm:mb-4 gap-2;
}

.seed-display {
  @apply text-base sm:text-lg font-semibold text-white;
  font-family: "Oswald", sans-serif;
}

.stats {
  @apply text-base sm:text-lg font-semibold text-white;
  font-family: "Oswald", sans-serif;
}

.game-canvas {
  @apply border-2 border-gray-600 bg-gray-900 touch-none w-[80vw] h-[60vh] max-w-full max-h-full;
}
</style>

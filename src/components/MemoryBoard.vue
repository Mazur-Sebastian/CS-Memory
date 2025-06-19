```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRouter } from "vue-router";

interface Rarity {
  name: string;
  color: string;
}

interface Skin {
  id: string;
  name: string;
  rarity: Rarity;
  image: string;
}

interface Tile {
  x: number;
  y: number;
  skin: Skin;
  flipped: boolean;
  matched: boolean;
  image: HTMLImageElement;
  flipProgress: number;
}

const props = defineProps<{
  seed: string;
}>();

const router = useRouter();

const parseSeed = (seed: string): { gridSize: number; layoutSeed: string } => {
  const match = seed.match(/^(4x4|6x6|8x8)_(.+)$/);
  if (!match) {
    console.warn(`Nieprawidłowy seed: ${seed}. Używam domyślnego 4x4.`);
    return { gridSize: 4, layoutSeed: String(Date.now()) };
  }
  const [, size, layoutSeed] = match;
  const gridSize = parseInt(size.split("x")[0]);
  return { gridSize, layoutSeed };
};

const { gridSize, layoutSeed } = parseSeed(props.seed);

const validGridSizes = [4, 6, 8];
if (!validGridSizes.includes(gridSize)) {
  console.warn(`Nieprawidłowy gridSize: ${gridSize}. Domyślny: 4`);
  router.push(`/game/4x4_${Date.now()}`);
}

const gameCanvas = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref<number>(window.innerWidth * 0.8);
const canvasHeight = ref(window.innerHeight * 0.6);
let ctx: CanvasRenderingContext2D | null;
let tiles = ref<Tile[]>([]);
let flippedTiles = ref<Tile[]>([]);

const moves = ref<number>(0);
const startTime = ref<number>(Date.now());
const elapsedTime = ref<number>(0);
const showModal = ref<boolean>(false);

const mousePos = ref<{ x: number; y: number }>({
  x: canvasWidth.value / 2,
  y: canvasHeight.value / 2,
});
const shellSound = new Audio("/sounds/gun-shell.mp3");
const shotSound = new Audio("/sounds/shot.mp3");
const reloadSound = new Audio("/sounds/reload.mp3");

const tileCount = gridSize * gridSize;
const tileMargin = ref<number>(10);
const tileSize = ref<number>(0);

const updateCanvasSize = () => {
  canvasWidth.value = window.innerWidth * 0.8;
  canvasHeight.value = window.innerHeight * 0.6;
  tileMargin.value = window.innerWidth < 640 ? 5 : 10;
  tileSize.value = Math.min(
    (canvasWidth.value - (gridSize + 1) * tileMargin.value) / gridSize,
    (canvasHeight.value - (gridSize + 1) * tileMargin.value) / gridSize
  );
  if (gameCanvas.value) {
    gameCanvas.value.width = canvasWidth.value;
    gameCanvas.value.height = canvasHeight.value;
  }
  updateTilesPosition();
  drawTiles(0);
};

const updateTilesPosition = () => {
  const offsetX =
    (canvasWidth.value -
      (gridSize * tileSize.value + (gridSize - 1) * tileMargin.value)) /
    2;
  const offsetY =
    (canvasHeight.value -
      (gridSize * tileSize.value + (gridSize - 1) * tileMargin.value)) /
    2;
  tiles.value.forEach((tile, index) => {
    const i = Math.floor(index / gridSize);
    const j = index % gridSize;
    tile.x = offsetX + j * (tileSize.value + tileMargin.value);
    tile.y = offsetY + i * (tileSize.value + tileMargin.value);
  });
};

let timerInterval: number | null = null;
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime.value = Date.now() - startTime.value;
    saveGameState();
  }, 1000);
};

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(elapsedTime.value / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
});

const getDifficulty = (seed: string): string => {
  if (seed.startsWith("4x4_")) return "Łatwy";
  if (seed.startsWith("6x6_")) return "Średni";
  if (seed.startsWith("8x8_")) return "Trudny";
  return "";
};

const saveGameHistory = () => {
  const history = JSON.parse(localStorage.getItem("memoryGameHistory") || "[]");
  history.push({
    seed: props.seed,
    moves: moves.value,
    time: Math.floor(elapsedTime.value / 1000),
    difficulty: getDifficulty(props.seed),
    date: new Date().toISOString(),
  });
  localStorage.setItem("memoryGameHistory", JSON.stringify(history));
};

const saveGameState = () => {
  const state = {
    seed: props.seed,
    tiles: tiles.value.map((tile) => ({
      x: tile.x,
      y: tile.y,
      skin: tile.skin,
      flipped: tile.matched ? true : false, // Zapisz flipped tylko dla matched
      matched: tile.matched,
      flipProgress: tile.matched ? 1 : 0, // Widoczne tylko dla matched
    })),
    flippedTiles: [], // Nie zapisuj flippedTiles (tylko matched)
    moves: moves.value,
    startTime: startTime.value,
    elapsedTime: elapsedTime.value,
  };
  localStorage.setItem(`memoryGameState_${props.seed}`, JSON.stringify(state));
  console.log("Zapisany stan gry:", {
    tiles: state.tiles.map((t) => ({
      flipped: t.flipped,
      matched: t.matched,
      flipProgress: t.flipProgress,
    })),
    flippedTiles: state.flippedTiles,
    moves: state.moves,
  });
};

const loadGameState = (): {
  tiles: Tile[];
  flippedTiles: Tile[];
  moves: number;
  startTime: number;
  elapsedTime: number;
} | null => {
  const savedState = localStorage.getItem(`memoryGameState_${props.seed}`);
  if (!savedState) return null;
  try {
    const state = JSON.parse(savedState);
    if (state.seed !== props.seed) return null;
    const loadedTiles = state.tiles.map((tile: any) => ({
      x: tile.x,
      y: tile.y,
      skin: tile.skin,
      flipped: tile.matched ? true : false, // Tylko matched mają flipped
      matched: tile.matched,
      flipProgress: tile.matched ? 1 : 0, // Tylko matched są widoczne
      image: (() => {
        const img = new Image();
        img.src = tile.skin.image;
        return img;
      })(),
    }));
    const loadedFlippedTiles: Tile[] = []; // Pusta lista, bo nie zapisujemy flipped
    console.log("Wczytany stan gry:", {
      tiles: loadedTiles.map((t: Tile) => ({
        flipped: t.flipped,
        matched: t.matched,
        flipProgress: t.flipProgress,
      })),
      flippedTiles: loadedFlippedTiles,
      moves: state.moves,
    });
    return {
      tiles: loadedTiles,
      flippedTiles: loadedFlippedTiles,
      moves: state.moves,
      startTime: state.startTime,
      elapsedTime: state.elapsedTime,
    };
  } catch (e) {
    console.warn("Błąd podczas ładowania stanu gry:", e);
    return null;
  }
};

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

const seedHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash >>> 0;
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
  const savedState = loadGameState();
  if (savedState) {
    tiles.value = savedState.tiles;
    flippedTiles.value = savedState.flippedTiles;
    moves.value = savedState.moves;
    startTime.value = savedState.startTime;
    elapsedTime.value = savedState.elapsedTime;
    updateCanvasSize();
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
  updateCanvasSize();

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
  updateTilesPosition();
  await Promise.all(imagePromises);
  saveGameState();
  requestAnimationFrame(() => drawTiles(0));
  startTimer();
};

const drawTiles = (_timestamp: number): void => {
  if (ctx) {
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    tiles.value.forEach((tile) => {
      ctx.save();
      const scale = Math.abs(Math.cos(Math.PI * tile.flipProgress));
      ctx.translate(tile.x + tileSize.value / 2, tile.y + tileSize.value / 2);
      ctx.scale(scale, 1);
      ctx.translate(
        -(tile.x + tileSize.value / 2),
        -(tile.y + tileSize.value / 2)
      );

      if ((tile.flipped || tile.matched) && tile.flipProgress > 0.5) {
        const rarityColor = tile.skin.rarity.color || "#333";
        const gradient = ctx.createLinearGradient(
          tile.x,
          tile.y,
          tile.x + tileSize.value,
          tile.y + tileSize.value
        );
        gradient.addColorStop(0, rarityColor);
        gradient.addColorStop(1, "#ffffff");
        ctx.fillStyle = gradient;
        ctx.fillRect(tile.x, tile.y, tileSize.value, tileSize.value);
      } else {
        ctx.fillStyle = "#333";
        ctx.fillRect(tile.x, tile.y, tileSize.value, tileSize.value);
      }
      ctx.strokeStyle = "#000";
      ctx.strokeRect(tile.x, tile.y, tileSize.value, tileSize.value);

      if (
        (tile.flipped || tile.matched) &&
        tile.flipProgress > 0.5 &&
        tile.image.complete
      ) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(tile.x, tile.y, tileSize.value, tileSize.value);
        ctx.clip();
        const dx =
          (mousePos.value.x - canvasWidth.value / 2) / (canvasWidth.value / 2);
        const dy =
          (mousePos.value.y - canvasHeight.value / 2) /
          (canvasHeight.value / 2);
        const offsetX = dx * 10;
        const offsetY = dy * 10;
        const tiltAngle = dx * ((5 * Math.PI) / 180);
        ctx.translate(
          tile.x + tileSize.value / 2 + offsetX,
          tile.y + tileSize.value / 2 + offsetY
        );
        ctx.rotate(tiltAngle);
        ctx.translate(
          -(tile.x + tileSize.value / 2),
          -(tile.y + tileSize.value / 2)
        );
        ctx.drawImage(
          tile.image,
          tile.x,
          tile.y,
          tileSize.value,
          tileSize.value
        );
        ctx.restore();
      }
      ctx.restore();
    });
  }
};

const animateFlip = (
  tile: Tile,
  targetProgress: number,
  callback?: () => void
): void => {
  const startProgress = tile.flipProgress;
  const startTime = performance.now();
  const duration = 300;

  if (targetProgress === 1) {
    shellSound
      .play()
      .catch((e) => console.warn("Błąd odtwarzania dźwięku łuski:", e));
  }

  const animate = (currentTime: number): void => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    tile.flipProgress =
      startProgress + (targetProgress - startProgress) * progress;
    drawTiles(0);
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (callback) {
      callback();
    }
  };
  requestAnimationFrame(animate);
};

const checkMatch = (): void => {
  if (flippedTiles.value.length === 2) {
    const [first, second] = flippedTiles.value;
    if (first.skin.id === second.skin.id) {
      first.matched = true;
      second.matched = true;
      shotSound
        .play()
        .catch((e) => console.warn("Błąd odtwarzania dźwięku strzału:", e));
      flippedTiles.value = [];
      saveGameState(); // Zapisz po dopasowaniu
      if (tiles.value.every((tile) => tile.matched)) {
        saveGameHistory();
        showModal.value = true;
        if (timerInterval) clearInterval(timerInterval);
      }
    } else {
      reloadSound
        .play()
        .catch((e) =>
          console.warn("Błąd odtwarzania dźwięku przeładowania:", e)
        );
      setTimeout(() => {
        animateFlip(first, 0, () => {
          first.flipped = false;
          drawTiles(0);
        });
        animateFlip(second, 0, () => {
          second.flipped = false;
          drawTiles(0);
        });
        flippedTiles.value = [];
        saveGameState(); // Zapisz po niedopasowaniu
      }, 1000);
    }
  }
};

const handleCanvasClick = (event: MouseEvent | TouchEvent): void => {
  if (gameCanvas.value && flippedTiles.value.length < 2 && !showModal.value) {
    const rect = gameCanvas.value.getBoundingClientRect();
    let x: number, y: number;
    if (event instanceof TouchEvent && event.touches.length > 0) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else if (event instanceof MouseEvent) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else {
      return;
    }

    tiles.value.forEach((tile) => {
      if (
        !tile.flipped &&
        !tile.matched &&
        x >= tile.x &&
        x <= tile.x + tileSize.value &&
        y >= tile.y &&
        y <= tile.y + tileSize.value
      ) {
        tile.flipped = true;
        flippedTiles.value.push(tile);
        moves.value += 1;
        animateFlip(tile, 1);
        checkMatch();
      }
    });
  }
};

const handleMouseMove = (event: MouseEvent): void => {
  if (gameCanvas.value) {
    const rect = gameCanvas.value.getBoundingClientRect();
    mousePos.value.x = event.clientX - rect.left;
    mousePos.value.y = event.clientY - rect.top;
    drawTiles(0);
  }
};

const handleTouchMove = (event: TouchEvent): void => {
  if (gameCanvas.value && event.touches.length > 0) {
    const rect = gameCanvas.value.getBoundingClientRect();
    mousePos.value.x = event.touches[0].clientX - rect.left;
    mousePos.value.y = event.touches[0].clientY - rect.top;
    drawTiles(0);
  }
};

watch(
  () => props.seed,
  async () => {
    const { gridSize: newGridSize } = parseSeed(props.seed);
    if (validGridSizes.includes(newGridSize)) {
      updateCanvasSize();
      await initTiles();
    } else {
      router.push(`/game/4x4_${Date.now()}`);
    }
  }
);

onMounted(() => {
  if (gameCanvas.value) {
    ctx = gameCanvas.value.getContext("2d");
    updateCanvasSize();
    initTiles();
    gameCanvas.value.addEventListener("click", handleCanvasClick);
    gameCanvas.value.addEventListener("mousemove", handleMouseMove);
    gameCanvas.value.addEventListener("touchstart", handleCanvasClick);
    gameCanvas.value.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("resize", updateCanvasSize);
  }
});

onUnmounted(() => {
  if (gameCanvas.value) {
    gameCanvas.value.removeEventListener("click", handleCanvasClick);
    gameCanvas.value.removeEventListener("mousemove", handleMouseMove);
    gameCanvas.value.removeEventListener("touchstart", handleCanvasClick);
    gameCanvas.value.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("resize", updateCanvasSize);
  }
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<template>
  <div class="container">
    <div class="info-bar">
      <div class="seed-display">Seed: {{ props.seed }}</div>
      <div class="stats">Ruchy: {{ moves }} | Czas: {{ formattedTime }}</div>
      <button @click="resetGame" class="button">Reset gry</button>
    </div>
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2 class="modal-title">Gratulacje!</h2>
        <p class="modal-text">Ukończyłeś grę!</p>
        <p class="modal-text">Ruchy: {{ moves }} | Czas: {{ formattedTime }}</p>
        <div class="modal-actions">
          <button @click="resetGame" class="button">Zagraj ponownie</button>
          <button @click="router.push('/')" class="button">Wróć do menu</button>
        </div>
      </div>
    </div>
  </div>
</template>

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

.button {
  @apply text-white px-4 py-2 hover:bg-[#2a6b94] transition-colors text-sm sm:text-base font-semibold;
  background-color: rgb(50, 129, 172);
  border-radius: 2px;
  font-family: "Oswald", sans-serif;
}

.game-canvas {
  @apply border-2 border-gray-600 bg-gray-900 touch-none w-[80vw] h-[60vh] max-w-full max-h-full;
}

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

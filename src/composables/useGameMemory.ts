import { ref, type Ref } from "vue";
import type { Tile } from "../types/game";
import { useGameHistory } from "./useGameHistory";
import { useGameStats } from "./useGameStats";

export const useGameMemory = () => {
  const { saveGameHistory } = useGameHistory();
  const { saveGameState } = useGameStats();

  const canvasWidth = ref<number>(window.innerWidth);
  const canvasHeight = ref(window.innerHeight - 80);
  const mousePos = ref<{ x: number; y: number }>({
    x: canvasWidth.value / 2,
    y: canvasHeight.value / 2,
  });
  const tileSize = ref<number>(0);
  const ctx: Ref<CanvasRenderingContext2D | null> = ref(null);
  const tiles = ref<Tile[]>([]);
  const tileMargin = ref<number>(5);
  const flippedTiles = ref<Tile[]>([]);
  const moves = ref<number>(0);

  const shellSound = new Audio("/sounds/gun-shell.mp3");
  const shotSound = new Audio("/sounds/shot.mp3");
  const reloadSound = new Audio("/sounds/reload.mp3");

  const saveGameStateWithStats = (
    seed: string,
    startTime: number,
    elapsedTime: number
  ) => {
    saveGameState({
      seed,
      tiles: tiles.value,
      flippedTiles: flippedTiles.value,
      moves: moves.value,
      startTime,
      elapsedTime,
    });
  };

  const drawTiles = (ctx: CanvasRenderingContext2D | null): void => {
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
            (mousePos.value.x - canvasWidth.value / 2) /
            (canvasWidth.value / 2);
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

  const updateTilesPosition = (gridSize: number) => {
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

  const updateCanvasSize = (
    gridSize: number,
    gameCanvas: HTMLCanvasElement | null,
    ctx: CanvasRenderingContext2D | null
  ) => {
    canvasWidth.value = window.innerWidth;
    canvasHeight.value = window.innerHeight - 80;
    tileMargin.value = window.innerWidth < 640 ? 5 : 4;
    tileSize.value = Math.min(
      (canvasWidth.value - (gridSize + 1) * tileMargin.value) / gridSize,
      (canvasHeight.value - (gridSize + 1) * tileMargin.value) / gridSize
    );
    if (gameCanvas) {
      gameCanvas.width = canvasWidth.value;
      gameCanvas.height = canvasHeight.value;
    }
    updateTilesPosition(gridSize);
    drawTiles(ctx);
  };

  const animateFlip = (
    tile: Tile,
    targetProgress: number,
    ctx: CanvasRenderingContext2D | null,
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
      drawTiles(ctx);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (callback) {
        callback();
      }
    };
    requestAnimationFrame(animate);
  };

  const checkMatch = (
    seed: string,
    startTime: number,
    elapsedTime: number,
    timerInterval: number | null,
    showModal: Ref<boolean>,
    ctx: CanvasRenderingContext2D | null
  ): void => {
    if (flippedTiles.value.length === 2) {
      const [first, second] = flippedTiles.value;
      if (first.skin.id === second.skin.id) {
        first.matched = true;
        second.matched = true;
        shotSound
          .play()
          .catch((e) => console.warn("Błąd odtwarzania dźwięku strzału:", e));
        flippedTiles.value = [];
        saveGameStateWithStats(seed, startTime, elapsedTime);
        if (tiles.value.every((tile) => tile.matched)) {
          saveGameHistory(seed, moves.value, elapsedTime);
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
          animateFlip(first, 0, ctx, () => {
            first.flipped = false;
            drawTiles(ctx);
          });
          animateFlip(second, 0, ctx, () => {
            second.flipped = false;
            drawTiles(ctx);
          });
          flippedTiles.value = [];
          saveGameStateWithStats(seed, startTime, elapsedTime);
        }, 1000);
      }
    }
  };

  const canvasClick = (
    event: MouseEvent | TouchEvent,
    gameCanvas: HTMLCanvasElement,
    seed: string,
    startTime: number,
    elapsedTime: number,
    timerInterval: number | null,
    showModal: Ref<boolean>,
    ctx: CanvasRenderingContext2D | null
  ): void => {
    const rect = gameCanvas.getBoundingClientRect();
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
        animateFlip(tile, 1, ctx);
        checkMatch(seed, startTime, elapsedTime, timerInterval, showModal, ctx);
      }
    });
  };

  const mouseMove = (
    event: MouseEvent,
    gameCanvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D | null
  ): void => {
    const rect = gameCanvas.getBoundingClientRect();
    mousePos.value.x = event.clientX - rect.left;
    mousePos.value.y = event.clientY - rect.top;
    drawTiles(ctx);
  };

  const touchMove = (
    event: TouchEvent,
    gameCanvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D | null
  ): void => {
    const rect = gameCanvas.getBoundingClientRect();
    mousePos.value.x = event.touches[0].clientX - rect.left;
    mousePos.value.y = event.touches[0].clientY - rect.top;
    drawTiles(ctx);
  };

  return {
    drawTiles,
    updateCanvasSize,
    updateTilesPosition,
    canvasClick,
    tiles,
    moves,
    flippedTiles,
    mouseMove,
    touchMove,
    ctx,
  };
};

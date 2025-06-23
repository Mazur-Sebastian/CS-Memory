import { ref } from "vue";
import { useErrorHandler } from "./useErrorHandler";

export const useSeed = () => {
  const { showError } = useErrorHandler();

  const seed = ref<string>("");

  const generateRandomSeed = (gridSize: number): string => {
    const randomNum = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0");
    return `${gridSize}x${gridSize}_${randomNum}`;
  };

  const parseSeed = (
    seed: string
  ): { gridSize: number; layoutSeed: string } => {
    const match = seed.match(/^(4x4|6x6|8x8)_(.+)$/);
    if (!match) {
      showError(`Invalid seed: ${seed}. Using default 4x4.`);
      return { gridSize: 4, layoutSeed: String(Date.now()) };
    }
    const [, size, layoutSeed] = match;
    const gridSize = parseInt(size.split("x")[0]);
    return { gridSize, layoutSeed };
  };

  return { seed, generateRandomSeed, parseSeed };
};

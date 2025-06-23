import { ref } from "vue";

import type { GameRecord } from "../types/gameRecord";
import { useErrorHandler } from "./useErrorHandler";

export const useGameHistory = () => {
  const { showError } = useErrorHandler();
  const gameHistory = ref<GameRecord[]>([]);

  const getHistory = () =>
    JSON.parse(localStorage.getItem("memoryGameHistory") || "[]");

  const loadGameHistory = () => {
    try {
      const history = getHistory();
      gameHistory.value = [...history].sort(
        (a: GameRecord, b: GameRecord) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (e) {
      showError("Error while loading game history");
      gameHistory.value = [];
    }
  };

  const saveGameHistory = (
    seed: string,
    moves: number,
    elapsedTime: number
  ) => {
    const history = getHistory();

    const getDifficulty = (seed: string): string => {
      switch (true) {
        case seed.startsWith("4x4_"):
          return "Easy";
        case seed.startsWith("6x6_"):
          return "Medium";
        case seed.startsWith("8x8_"):
          return "Hard";
        default:
          return "";
      }
    };

    history.push({
      seed,
      moves,
      time: Math.floor(elapsedTime / 1000),
      difficulty: getDifficulty(seed),
      date: new Date().toISOString(),
    });
    localStorage.setItem("memoryGameHistory", JSON.stringify(history));
  };

  return {
    gameHistory,
    loadGameHistory,
    saveGameHistory,
  };
};

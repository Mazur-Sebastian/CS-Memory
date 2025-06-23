import type { Tile } from "../types/game";
import { useErrorHandler } from "./useErrorHandler";

export type Stats = {
  seed: string;
  tiles: Tile[];
  moves: number;
  startTime: number;
  elapsedTime: number;
  flippedTiles: Tile[];
};

export const useGameStats = () => {
  const { showError } = useErrorHandler();

  const saveGameState = ({
    seed,
    tiles,
    moves,
    startTime,
    elapsedTime,
  }: Stats) => {
    const state = {
      seed,
      tiles: tiles.map((tile) => ({
        x: tile.x,
        y: tile.y,
        skin: tile.skin,
        flipped: tile.matched,
        matched: tile.matched,
        flipProgress: tile.matched ? 1 : 0,
      })),
      flippedTiles: [],
      moves,
      startTime,
      elapsedTime,
    };

    localStorage.setItem(`memoryGameState_${seed}`, JSON.stringify(state));
  };

  const loadGameState = (seed: Stats["seed"]): Omit<Stats, "seed"> | null => {
    const savedState = localStorage.getItem(`memoryGameState_${seed}`);

    if (!savedState) return null;

    try {
      const state = JSON.parse(savedState);
      if (state.seed !== seed) return null;
      const loadedTiles = state.tiles.map((tile: any) => ({
        x: tile.x,
        y: tile.y,
        skin: tile.skin,
        flipped: tile.matched,
        matched: tile.matched,
        flipProgress: tile.matched ? 1 : 0,
        image: (() => {
          const img = new Image();
          img.src = tile.skin.image;
          return img;
        })(),
      }));

      const loadedFlippedTiles: Tile[] = [];

      return {
        tiles: loadedTiles,
        flippedTiles: loadedFlippedTiles,
        moves: state.moves,
        startTime: state.startTime,
        elapsedTime: state.elapsedTime,
      };
    } catch (e) {
      showError("Error loading game state");
      return null;
    }
  };

  return { saveGameState, loadGameState };
};

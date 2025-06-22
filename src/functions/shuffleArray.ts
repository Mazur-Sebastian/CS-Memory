export const shuffleArray = <T>(array: T[], seed: number): T[] => {
  const seedHash = (str: string): number =>
    Array.from(str).reduce(
      (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0,
      0
    ) >>> 0;

  const hashedSeed = seedHash(seed.toString());

  const rng = (state: number, max: number): [number, number] => {
    const a = 1664525;
    const c = 1013904223;
    const newState = (a * state + c) >>> 0;
    return [newState % max, newState];
  };

  const shuffle = (arr: T[], i: number, state: number): T[] => {
    if (i <= 0) return arr;
    const [j, newState] = rng(state, i + 1);
    const newArr = arr.slice();
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    return shuffle(newArr, i - 1, newState);
  };

  return shuffle(array.slice(), array.length - 1, hashedSeed);
};

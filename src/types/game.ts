export interface Rarity {
  name: string;
  color: string;
}

export interface Skin {
  id: string;
  name: string;
  rarity: Rarity;
  image: string;
}

export interface Tile {
  x: number;
  y: number;
  skin: Skin;
  flipped: boolean;
  matched: boolean;
  image: HTMLImageElement;
  flipProgress: number;
}

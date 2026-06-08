export type PaletteMode =
  | "Random"
  | "Analogous"
  | "Monochromatic"
  | "Complementary"
  | "Triadic"
  | "Split Complementary"
  | "Tetradic";

export type PaletteColor = {
  id: string;
  hex: string;
  alpha: number;
  locked: boolean;
};

export type PaletteRecord = {
  id: string;
  name: string;
  colors: string[];
  alphas: number[];
  mode: PaletteMode;
  tags: string[];
  collection: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  usedAt: string;
};

export type ContrastHint = {
  hex: string;
  bestTextColor: "#000000" | "#FFFFFF";
  ratio: number;
  aa: boolean;
  aaa: boolean;
  rating: "AAA" | "AA" | "Fail";
};

export type ExportFormat = "CSS" | "SCSS" | "Tailwind" | "JSON" | "Tokens" | "Style Dictionary" | "SVG";
export type GradientKind = "linear" | "radial";
export type VisionMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";
export type LibrarySort = "recent" | "brightness" | "contrast" | "temperature" | "favorites";

export type DesignTokenSet = {
  colors: string[];
  alphas: number[];
  spacing: number[];
  radii: number[];
  shadows: string[];
  durations: number[];
};


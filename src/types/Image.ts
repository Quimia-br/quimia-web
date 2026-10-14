export type ImageValue = File | string | null;
export type ImageShape = "circle" | "rectangle";

export const IMAGE_ASPECT_RATIOS: Record<ImageShape, number> = {
  circle: 1,
  rectangle: 246 / 388,
};

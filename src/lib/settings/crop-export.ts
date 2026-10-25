import { exceedsPixelCap, type Rect, type Size } from "@/lib/settings/crop";
import { AVATAR_MAX_BYTES } from "@/validators/avatar.validator";

export const AVATAR_RAW_MAX_BYTES = 15 * 1024 * 1024;

const OUTPUT_SIZE = 512;
const QUALITIES = [0.9, 0.8, 0.7];

export class ImageTooBigError extends Error {}

export type DecodedImage = {
  source: ImageBitmap | HTMLImageElement;
  size: Size;
  url: string;
  release: () => void;
};

function loadElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("decode"));
    element.src = url;
  });
}

async function decodeUnchecked(file: File): Promise<DecodedImage> {
  const url = URL.createObjectURL(file);
  try {
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        return {
          source: bitmap,
          size: { width: bitmap.width, height: bitmap.height },
          url,
          release: () => {
            bitmap.close();
            URL.revokeObjectURL(url);
          },
        };
      } catch {
        // Some browsers reject the options bag; the image element path below still decodes it.
      }
    }
    const element = await loadElement(url);
    const size = { width: element.naturalWidth, height: element.naturalHeight };
    return { source: element, size, url, release: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function decodeImage(file: File): Promise<DecodedImage> {
  const image = await decodeUnchecked(file);
  if (exceedsPixelCap(image.size)) {
    image.release();
    throw new ImageTooBigError();
  }
  return image;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export type CropResult = File | "tooLarge" | "failed";

function draw(canvas: HTMLCanvasElement, image: DecodedImage, region: Rect, backdrop: boolean) {
  const context = canvas.getContext("2d");
  if (!context) return false;
  if (backdrop) {
    context.fillStyle = "#fff";
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  }
  context.drawImage(
    image.source,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  return true;
}

// Browsers without WebP encoding silently return PNG, so the returned type is checked. JPEG has
// no alpha, so the canvas is redrawn on white before that fallback.
async function encode(
  canvas: HTMLCanvasElement,
  image: DecodedImage,
  region: Rect,
  quality: number,
): Promise<Blob | null> {
  const webp = await toBlob(canvas, "image/webp", quality);
  if (webp?.type === "image/webp") return webp;
  if (!draw(canvas, image, region, true)) return null;
  return toBlob(canvas, "image/jpeg", quality);
}

export async function renderCrop(image: DecodedImage, region: Rect): Promise<CropResult> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  if (!draw(canvas, image, region, false)) return "failed";
  let encoded = false;
  for (const quality of QUALITIES) {
    const blob = await encode(canvas, image, region, quality);
    if (!blob) continue;
    encoded = true;
    if (blob.size <= AVATAR_MAX_BYTES) {
      const extension = blob.type === "image/webp" ? "webp" : "jpg";
      return new File([blob], `avatar.${extension}`, { type: blob.type });
    }
  }
  return encoded ? "tooLarge" : "failed";
}

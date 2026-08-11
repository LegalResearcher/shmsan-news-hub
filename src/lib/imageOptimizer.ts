/**
 * Image Optimization Utility - South Voice
 * Resizes images to max 1200px width, converts to WebP, and compresses to < 100KB
 *
 * Also provides a much smaller "thumbnail" variant (400px / ~25KB) used in list
 * cards (home, categories, related news) instead of the full image — to reduce
 * Storage Egress on Supabase. The full image remains reserved for the hero and
 * the single post detail page.
 */

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const TARGET_SIZE_KB = 100;
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.3;

const THUMB_MAX_WIDTH = 400;
const THUMB_MAX_HEIGHT = 400;
const THUMB_TARGET_SIZE_KB = 25;
const THUMB_INITIAL_QUALITY = 0.8;

interface OptimizedImage {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Load an image from a File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if necessary
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Convert canvas to WebP blob with specified quality
 */
function canvasToWebP(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Shared core: resize an image to the given max dimensions, encode as WebP,
 * and iteratively lower quality until under the target size.
 */
async function resizeAndCompress(
  file: File,
  maxWidth: number,
  maxHeight: number,
  targetSizeKb: number,
  initialQuality: number
): Promise<OptimizedImage> {
  const originalSize = file.size;

  const img = await loadImage(file);

  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxWidth,
    maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(img.src);
    throw new Error('Failed to get canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(img.src);

  let quality = initialQuality;
  let blob = await canvasToWebP(canvas, quality);

  while (blob.size > targetSizeKb * 1024 && quality > MIN_QUALITY) {
    quality -= 0.05;
    blob = await canvasToWebP(canvas, quality);
  }

  return {
    blob,
    width,
    height,
    originalSize,
    optimizedSize: blob.size,
    compressionRatio: originalSize / blob.size,
  };
}

/**
 * Optimize an image file (full version, used on the post detail page):
 * - Resize to max 1200px width/height
 * - Convert to WebP format
 * - Compress to target size (< 100KB)
 */
export async function optimizeImage(file: File): Promise<OptimizedImage> {
  return resizeAndCompress(file, MAX_WIDTH, MAX_HEIGHT, TARGET_SIZE_KB, INITIAL_QUALITY);
}

/**
 * Generate a much smaller thumbnail (~400px, <25KB) of the same image, used in
 * list/card views (home, categories, related news) instead of the full image.
 */
export async function generateThumbnail(file: File): Promise<OptimizedImage> {
  return resizeAndCompress(file, THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT, THUMB_TARGET_SIZE_KB, THUMB_INITIAL_QUALITY);
}

/**
 * Check if a file is an image that can be optimized
 */
export function isOptimizableImage(file: File): boolean {
  const optimizableTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return optimizableTypes.includes(file.type);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

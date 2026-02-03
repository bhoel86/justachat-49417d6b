/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

/**
 * Client-side image compression and resizing utility.
 * Downscales images to a max dimension and compresses to reduce upload size.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for JPEG/WebP
  outputType?: "image/jpeg" | "image/webp" | "image/png";
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  outputType: "image/jpeg",
};

/**
 * Compress and resize an image file.
 * Returns a new File with the compressed image data.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for GIFs (animated) - just return original
  if (file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // If image is already small and same type, skip compression
      if (
        width === img.width &&
        height === img.height &&
        file.size < 500 * 1024 && // < 500KB
        (file.type === opts.outputType || file.type === "image/png")
      ) {
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          // Determine file extension
          const ext = opts.outputType === "image/png" ? "png" : 
                      opts.outputType === "image/webp" ? "webp" : "jpg";
          
          // Create new filename
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const newName = `${baseName}_compressed.${ext}`;

          const compressedFile = new File([blob], newName, {
            type: opts.outputType,
            lastModified: Date.now(),
          });

          console.log(
            `Image compressed: ${file.name} (${(file.size / 1024).toFixed(1)}KB) → ${newName} (${(compressedFile.size / 1024).toFixed(1)}KB), ${width}x${height}`
          );

          resolve(compressedFile);
        },
        opts.outputType,
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
}

/**
 * Check if a file needs compression based on size/dimensions.
 */
export function shouldCompress(file: File, maxSizeKB = 1024): boolean {
  // Always compress large files
  if (file.size > maxSizeKB * 1024) return true;
  
  // Skip GIFs
  if (file.type === "image/gif") return false;
  
  // For smaller files, we'll still run through compression to ensure max dimensions
  return true;
}

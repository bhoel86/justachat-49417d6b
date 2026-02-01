import { useEffect, useState } from "react";

type CutoutOptions = {
  /**
   * How close a pixel must be to "near-white" to be treated as background.
   * Higher = more aggressive removal.
   */
  nearWhiteMin?: number; // 0-255
  /**
   * Max channel difference (R/G/B) to be considered "neutral" (not saturated).
   */
  neutralMaxDelta?: number; // 0-255
  /** Padding (in pixels) around the trimmed bounds */
  padding?: number;

  /**
   * Background similarity tolerance used for edge flood-fill removal.
   * Higher = more aggressive background removal.
   */
  bgTolerance?: number; // 0-255 (euclidean distance in RGB)

  /** Size of the corner sample patch (in pixels) used to estimate background color */
  cornerSampleSize?: number;
};

const defaultOpts: Required<CutoutOptions> = {
  nearWhiteMin: 232,
  neutralMaxDelta: 10,
  padding: 12,
  bgTolerance: 34,
  cornerSampleSize: 10,
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const distRgb = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const avgCornerPatch = (
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number,
  y0: number,
  size: number
): { r: number; g: number; b: number } | null => {
  const x1 = clamp(x0, 0, w - 1);
  const y1 = clamp(y0, 0, h - 1);
  const xMax = clamp(x1 + size, 0, w);
  const yMax = clamp(y1 + size, 0, h);

  let rSum = 0,
    gSum = 0,
    bSum = 0,
    count = 0;

  for (let y = y1; y < yMax; y++) {
    for (let x = x1; x < xMax; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a === 0) continue; // ignore already-transparent pixels
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    }
  }

  if (!count) return null;
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
};

/**
 * Turns a "fake transparent" PNG (checkerboard baked into pixels) into a real cutout:
 * - makes near-white neutral pixels fully transparent
 * - auto-trims to non-transparent bounds + padding
 */
export function usePngCutout(src?: string, options?: CutoutOptions) {
  const [cutoutSrc, setCutoutSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setCutoutSrc(null);
      return;
    }

    const opts = { ...defaultOpts, ...(options ?? {}) };
    let cancelled = false;

    const run = async () => {
      const img = new Image();
      img.decoding = "async";
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = src;
      });

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // 1) Remove a solid-ish background rectangle using an edge flood-fill
      // (web "cutout" tools typically do something like this).
      const sampleSize = clamp(opts.cornerSampleSize, 1, 64);
      const tl = avgCornerPatch(data, w, h, 0, 0, sampleSize);
      const tr = avgCornerPatch(data, w, h, w - sampleSize, 0, sampleSize);
      const bl = avgCornerPatch(data, w, h, 0, h - sampleSize, sampleSize);
      const br = avgCornerPatch(data, w, h, w - sampleSize, h - sampleSize, sampleSize);

      const candidates = [tl, tr, bl, br].filter(Boolean) as Array<{ r: number; g: number; b: number }>;
      if (candidates.length) {
        // Pick the most "background-like" candidate by choosing the one
        // with smallest total distance to the other samples.
        let best = candidates[0];
        let bestScore = Number.POSITIVE_INFINITY;
        for (const c of candidates) {
          let score = 0;
          for (const o of candidates) {
            score += distRgb(c.r, c.g, c.b, o.r, o.g, o.b);
          }
          if (score < bestScore) {
            bestScore = score;
            best = c;
          }
        }

        const tol = clamp(opts.bgTolerance, 0, 255);
        const visited = new Uint8Array(w * h);
        const q: number[] = [];

        // Seed flood-fill with the outer border pixels.
        for (let x = 0; x < w; x++) {
          q.push(x); // top row
          q.push((h - 1) * w + x); // bottom row
        }
        for (let y = 0; y < h; y++) {
          q.push(y * w); // left
          q.push(y * w + (w - 1)); // right
        }

        while (q.length) {
          const p = q.pop()!;
          if (visited[p]) continue;
          visited[p] = 1;

          const i = p * 4;
          const a = data[i + 3];
          if (a === 0) continue; // already transparent

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Only remove pixels that are sufficiently close to the estimated background.
          if (distRgb(r, g, b, best.r, best.g, best.b) > tol) continue;

          data[i + 3] = 0;

          const x = p % w;
          const y = (p / w) | 0;

          if (x > 0) q.push(p - 1);
          if (x < w - 1) q.push(p + 1);
          if (y > 0) q.push(p - w);
          if (y < h - 1) q.push(p + w);
        }
      }

      // 2) Remove near-white neutral pixels (cleanup for leftover halos)
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a === 0) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        const nearWhite = r >= opts.nearWhiteMin && g >= opts.nearWhiteMin && b >= opts.nearWhiteMin;
        const neutral = max - min <= opts.neutralMaxDelta;

        if (nearWhite && neutral) {
          data[i + 3] = 0;
        }
      }

      // 3) Find non-transparent bounds
      let minX = w,
        minY = h,
        maxX = -1,
        maxY = -1;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const a = data[idx + 3];
          if (a > 0) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      // If we didn't find anything, bail out to original
      if (maxX < 0 || maxY < 0) {
        if (!cancelled) setCutoutSrc(null);
        return;
      }

      const pad = opts.padding;
      minX = clamp(minX - pad, 0, w - 1);
      minY = clamp(minY - pad, 0, h - 1);
      maxX = clamp(maxX + pad, 0, w - 1);
      maxY = clamp(maxY + pad, 0, h - 1);

      const outW = maxX - minX + 1;
      const outH = maxY - minY + 1;

      // Put alpha-adjusted pixels back
      ctx.putImageData(imageData, 0, 0);

      // 4) Crop to bounds
      const outCanvas = document.createElement("canvas");
      outCanvas.width = outW;
      outCanvas.height = outH;
      const outCtx = outCanvas.getContext("2d");
      if (!outCtx) return;
      outCtx.clearRect(0, 0, outW, outH);
      outCtx.drawImage(canvas, minX, minY, outW, outH, 0, 0, outW, outH);

      const out = outCanvas.toDataURL("image/png");
      if (!cancelled) setCutoutSrc(out);
    };

    run().catch(() => {
      if (!cancelled) setCutoutSrc(null);
    });

    return () => {
      cancelled = true;
    };
   }, [
     src,
     options?.nearWhiteMin,
     options?.neutralMaxDelta,
     options?.padding,
     options?.bgTolerance,
     options?.cornerSampleSize,
   ]);

  return cutoutSrc;
}

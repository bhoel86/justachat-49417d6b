# PNG Cutout Policy

## Rule (Mandatory)

When creating transparent PNG cutouts (logos, mascots, headers, etc.), **NEVER** rely on AI image generation to produce true transparency. AI-generated "transparent" PNGs almost always bake in a solid or checkerboard background.

## Required Approach

Always use the **`usePngCutout`** hook (or equivalent runtime processing) to strip backgrounds:

```tsx
import { usePngCutout } from "@/hooks/usePngCutout";

// The hook performs edge flood-fill removal + near-white cleanup + auto-trim
const cutoutSrc = usePngCutout(originalImageSrc);

// Use cutoutSrc in your <img> or as a background
<img src={cutoutSrc ?? originalImageSrc} alt="..." />
```

## How It Works

1. **Corner sampling** – Estimates background color from the four corners.
2. **Edge flood-fill** – Starting from the image border, removes all pixels within a tolerance of the estimated background (like a "magic wand" tool).
3. **Near-white cleanup** – Removes leftover neutral halos.
4. **Auto-trim** – Crops to the non-transparent bounding box with configurable padding.

## Tunable Options

| Option | Default | Description |
|--------|---------|-------------|
| `bgTolerance` | 34 | RGB Euclidean distance threshold for flood-fill |
| `cornerSampleSize` | 10 | Pixel patch size for corner sampling |
| `nearWhiteMin` | 232 | Minimum R/G/B to count as "near-white" |
| `neutralMaxDelta` | 10 | Max channel spread to count as neutral gray |
| `padding` | 12 | Pixels of padding around trimmed bounds |

## Violation

Attempting to use an AI-generated PNG directly as a cutout without processing through `usePngCutout` is considered an error and must be corrected.

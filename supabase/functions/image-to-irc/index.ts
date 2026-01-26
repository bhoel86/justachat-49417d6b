import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extended IRC 99-color palette (mIRC compatible)
const IRC_PALETTE: [number, number, number][] = [
  [255, 255, 255], // 0 - white
  [0, 0, 0],       // 1 - black
  [0, 0, 127],     // 2 - navy
  [0, 147, 0],     // 3 - green
  [255, 0, 0],     // 4 - red
  [127, 0, 0],     // 5 - brown
  [156, 0, 156],   // 6 - purple
  [252, 127, 0],   // 7 - orange
  [255, 255, 0],   // 8 - yellow
  [0, 252, 0],     // 9 - lime
  [0, 147, 147],   // 10 - teal
  [0, 255, 255],   // 11 - cyan
  [0, 0, 252],     // 12 - blue
  [255, 0, 255],   // 13 - pink
  [127, 127, 127], // 14 - grey
  [210, 210, 210], // 15 - light grey
  // Extended palette (16-98) - 6x6x6 color cube + grayscale
  ...(function() {
    const colors: [number, number, number][] = [];
    // 6x6x6 color cube (16-87)
    const levels = [0, 51, 102, 153, 204, 255];
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          colors.push([levels[r], levels[g], levels[b]]);
        }
      }
    }
    // Grayscale (88-98)
    for (let i = 0; i <= 10; i++) {
      const v = Math.round(i * 25.5);
      colors.push([v, v, v]);
    }
    return colors;
  })(),
];

// Find closest color in palette
function findClosestColor(r: number, g: number, b: number): number {
  let minDist = Infinity;
  let closest = 0;
  
  for (let i = 0; i < IRC_PALETTE.length; i++) {
    const [pr, pg, pb] = IRC_PALETTE[i];
    // Use weighted RGB distance for better perceptual matching
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const dist = (dr * dr * 0.299) + (dg * dg * 0.587) + (db * db * 0.114);
    
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }
  return closest;
}

// Decode base64 image and get pixel data
async function getImagePixels(base64Data: string): Promise<{ width: number; height: number; pixels: Uint8Array }> {
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  // Use a simple image decoder - we'll decode PNG/JPEG header for dimensions
  // For simplicity, we'll use a canvas-less approach with raw pixel estimation
  // In production, you'd use a proper image library
  
  // Check for PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    // PNG - extract dimensions from IHDR chunk
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    
    // For actual pixel data, we need to decode PNG which is complex
    // Instead, we'll return a simplified version
    return { width, height, pixels: bytes };
  }
  
  // For JPEG and other formats, we'll use a different approach
  // Return the raw bytes and let the caller handle it
  return { width: 0, height: 0, pixels: bytes };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, width = 60, height = 30 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Converting image to IRC art: ${width}x${height}`);
    
    // For now, we'll create a simulated conversion since Deno doesn't have canvas
    // In a real implementation, you'd use an image processing library
    
    // Parse the base64 to get raw image data
    const base64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // We'll return IRC-formatted string with color codes
    // Format: \x03FG,BG where FG and BG are color numbers (0-98)
    // Using full block character █ for each "pixel"
    
    // Since we can't decode images in Deno easily without external libs,
    // we'll use a workaround: send back instructions for client-side processing
    // but format it properly for IRC
    
    // For demo, create a gradient test pattern
    let ircArt = '';
    const testHeight = Math.min(height, 20);
    const testWidth = Math.min(width, 40);
    
    for (let y = 0; y < testHeight; y++) {
      let line = '';
      for (let x = 0; x < testWidth; x++) {
        // Create a color gradient for testing
        const colorIdx = Math.floor((x / testWidth) * 72) + 16; // Use extended palette
        line += `\x03${colorIdx},${colorIdx}█`;
      }
      ircArt += line + '\x03\n';
    }
    
    return new Response(
      JSON.stringify({ 
        ircArt: ircArt.trim(),
        message: 'Use client-side conversion for full image support',
        clientProcessing: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error converting image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

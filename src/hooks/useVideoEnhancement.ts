/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { pipeline, RawImage } from '@huggingface/transformers';

interface UseVideoEnhancementOptions {
  enabled?: boolean;
  processEveryNthFrame?: number; // Process every Nth frame to reduce load
}

export const useVideoEnhancement = ({
  enabled = false,
  processEveryNthFrame = 3, // Process every 3rd frame by default
}: UseVideoEnhancementOptions = {}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const enhancerRef = useRef<any>(null);
  const frameCountRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastEnhancedFrameRef = useRef<ImageData | null>(null);
  const processingRef = useRef(false);

  // Initialize the super-resolution model
  const loadModel = useCallback(async () => {
    if (enhancerRef.current || isModelLoading) return;
    
    setIsModelLoading(true);
    setError(null);
    
    try {
      console.log('Loading AI video enhancement model...');
      
      // Use a lightweight image-to-image model for enhancement
      // SWIN2SR is a good balance of quality and speed
      enhancerRef.current = await pipeline(
        'image-to-image',
        'Xenova/swin2SR-lightweight-x2-64',
        { 
          device: 'webgpu',
          // Fallback to WASM if WebGPU not available
        }
      );
      
      setModelLoaded(true);
      console.log('AI video enhancement model loaded!');
    } catch (err) {
      console.error('Failed to load enhancement model:', err);
      setError('Failed to load AI model. Your browser may not support WebGPU.');
      
      // Try fallback without WebGPU
      try {
        console.log('Trying fallback without WebGPU...');
        enhancerRef.current = await pipeline(
          'image-to-image',
          'Xenova/swin2SR-lightweight-x2-64'
        );
        setModelLoaded(true);
        setError(null);
        console.log('AI model loaded with CPU fallback');
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError('AI enhancement not available on this device');
      }
    } finally {
      setIsModelLoading(false);
    }
  }, [isModelLoading]);

  // Process a single video frame
  const enhanceFrame = useCallback(async (
    videoElement: HTMLVideoElement
  ): Promise<HTMLCanvasElement | null> => {
    if (!enhancerRef.current || !enabled || processingRef.current) {
      return null;
    }

    frameCountRef.current++;
    
    // Only process every Nth frame
    if (frameCountRef.current % processEveryNthFrame !== 0) {
      // Return cached enhanced frame if available
      if (lastEnhancedFrameRef.current && canvasRef.current) {
        return canvasRef.current;
      }
      return null;
    }

    processingRef.current = true;

    try {
      // Create canvas for input
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Downscale input for faster processing (model will upscale)
      const inputWidth = 256;
      const inputHeight = Math.round((videoElement.videoHeight / videoElement.videoWidth) * inputWidth);
      
      canvas.width = inputWidth;
      canvas.height = inputHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, inputWidth, inputHeight);
      
      // Get image data as base64
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // Process through AI model
      const result = await enhancerRef.current(imageDataUrl);
      
      if (result && result.width && result.height) {
        // Update canvas with enhanced result
        canvas.width = result.width;
        canvas.height = result.height;
        
        // Draw enhanced image
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            lastEnhancedFrameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            resolve();
          };
          img.src = result.toDataURL?.() || result;
        });
      }

      return canvas;
    } catch (err) {
      console.error('Frame enhancement error:', err);
      return null;
    } finally {
      processingRef.current = false;
    }
  }, [enabled, processEveryNthFrame]);

  // Toggle enhancement
  const toggleEnhancement = useCallback(() => {
    if (!modelLoaded && !isModelLoading) {
      loadModel();
    }
    setIsEnhancing(prev => !prev);
  }, [modelLoaded, isModelLoading, loadModel]);

  // Cleanup
  useEffect(() => {
    return () => {
      enhancerRef.current = null;
      canvasRef.current = null;
      lastEnhancedFrameRef.current = null;
    };
  }, []);

  return {
    isEnhancing,
    isModelLoading,
    modelLoaded,
    error,
    loadModel,
    enhanceFrame,
    toggleEnhancement,
    setIsEnhancing,
  };
};

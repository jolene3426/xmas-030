import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GoogleGenAI } from "@google/genai";
import * as THREE from 'three';
import { TreeMorphState } from './types';
import { Overlay } from './components/Overlay';
import { Stage } from './components/Stage';

// Helper to generate a texture
async function generateHolidayTexture(ai: GoogleGenAI, prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" } // Square for cube faces
      }
    });
    
    // Find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (e) {
    console.error("Failed to generate texture", e);
    return ''; // Return empty string on fail, will fallback to color
  }
}

function App() {
  // Start in TREE_SHAPE (Assemble Form) as requested
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);
  const [textures, setTextures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  const generateMemories = useCallback(async () => {
      setLoading(true);
      
      // Safe access to API Key to prevent ReferenceError in non-Node environments (e.g. static web hosting)
      let apiKey = null;
      try {
        if (typeof process !== 'undefined' && process.env) {
           apiKey = process.env.API_KEY;
        }
      } catch (e) {
        // process is not defined, ignore and proceed to fallback
      }

      // Skip generation if no API key is present
      if (!apiKey) {
        // Small delay to ensure loading screen is seen briefly before showing fallback content
        setTimeout(() => setLoading(false), 1500);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Generate 6 variations of Xmas aesthetic images
      const prompts = [
        "pinterest aesthetic christmas mood board, warm beige and gold, cozy winter vibes, high quality, photorealistic, cinematic lighting",
        "aesthetic christmas gift wrapping texture, red and gold foil pattern, elegant, macro photography",
        "snowy window view with blurred christmas lights, cinematic moody aesthetic, cozy atmosphere",
        "close up of golden sparkling christmas ornaments, magical atmosphere, bokeh, golden hour",
        "vintage christmas pattern, victorian style, gold leaf and deep green, aesthetic wallpaper",
        "close up of a homemade gingerbread cookie texture, golden brown baked surface with white icing details, photorealistic"
      ];

      try {
        const results = await Promise.all(prompts.map(p => generateHolidayTexture(ai, p)));
        setTextures(results.filter(t => t !== ''));
      } catch (e) {
        console.error("Texture generation failed", e);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    generateMemories();
  }, [generateMemories]);

  return (
    <div 
      className="relative w-full h-screen bg-[#1a0b05]"
      onPointerDown={() => setIsInteracting(true)}
      onPointerUp={() => setIsInteracting(false)}
      onPointerLeave={() => setIsInteracting(false)}
    >
      
      {/* 2D UI Overlay */}
      <Overlay 
        treeState={treeState} 
        setTreeState={setTreeState} 
        onReload={generateMemories}
      />

      {/* 3D Scene Canvas */}
      <Canvas
        dpr={[1, 2]} 
        shadows
        gl={{ 
            antialias: false,
            toneMapping: THREE.ReinhardToneMapping,
            toneMappingExposure: 2.2 // High exposure for bright aesthetic
        }} 
      >
        <Suspense fallback={null}>
          {!loading && (
            <Stage 
              treeState={treeState} 
              generatedTextures={textures} 
              paused={isInteracting} 
            />
          )}
        </Suspense>
      </Canvas>

      {/* Loading Screen */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center bg-[#1a0b05] z-50 transition-opacity duration-1000 ${!loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onTransitionEnd={(e) => {
            // Optional cleanup if needed
        }}
      >
           <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4"></div>
           <span className="text-[#FFD700] font-[Cinzel] tracking-widest text-sm animate-pulse">
             Developing Memories...
           </span>
      </div>
    </div>
  );
}

export default App;
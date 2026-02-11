import React, { useState, useEffect } from 'react';
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// UI Components
const Card = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className || ''}`}>
    {children}
  </div>
);

const Button = ({ 
  onClick, 
  disabled, 
  className, 
  children, 
  variant = 'primary' 
}: { 
  onClick?: () => void, 
  disabled?: boolean, 
  className?: string, 
  children?: React.ReactNode, 
  variant?: 'primary' | 'secondary' 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 focus:ring-indigo-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variants[variant]} ${className || ''}`}
    >
      {children}
    </button>
  );
};

// Helper Functions
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

const ensureApiKey = async () => {
  if ((window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }
};

// 2. Media Studio View
const MediaStudioView = () => {
  const [tab, setTab] = useState<'create' | 'edit' | 'video'>('create');
  
  // History State Management
  const [historyState, setHistoryState] = useState({
      history: [{
          prompt: "",
          aspectRatio: "1:1",
          qualityMode: "standard",
          refImage: null as File | null,
          resultUrl: null as string | null
      }],
      index: 0
  });

  const currentState = historyState.history[historyState.index];
  const { prompt, aspectRatio, qualityMode, refImage, resultUrl } = currentState;

  // Local state for prompt to allow smooth typing without spamming history
  const [localPrompt, setLocalPrompt] = useState(prompt);

  // Sync local prompt when history changes (Undo/Redo)
  useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt, historyState.index]);

  const pushState = (changes: Partial<typeof currentState>) => {
    setHistoryState(prev => {
        const current = prev.history[prev.index];
        // Create new state
        const next = { ...current, ...changes };
        
        // Don't push if effectively same (shallow check for primitives, strict for objects)
        const isSame = Object.keys(changes).every(k => (current as any)[k] === (changes as any)[k]);
        if (isSame) return prev;

        const nextHistory = prev.history.slice(0, prev.index + 1);
        nextHistory.push(next);
        return {
            history: nextHistory,
            index: nextHistory.length - 1
        };
    });
  };

  const handleUndo = () => {
    setHistoryState(prev => ({
        ...prev,
        index: Math.max(0, prev.index - 1)
    }));
  };

  const handleRedo = () => {
    setHistoryState(prev => ({
        ...prev,
        index: Math.min(prev.history.length - 1, prev.index + 1)
    }));
  };

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleGenerateContent = async () => {
    setLoading(true);
    setStatus("Processing with Gemini...");
    
    // Ensure prompt is committed to history before/during generation
    const currentPrompt = localPrompt; 
    // Push prompt state if it differs from current history (e.g. user clicked generate without blurring)
    if (currentPrompt !== prompt) {
        pushState({ prompt: currentPrompt });
    }

    try {
        let model = 'gemini-2.5-flash-image';
        let config: any = {
            imageConfig: { aspectRatio },
        };
        
        // Upgrade logic: Use Gemini 3 Pro for Standard (1K), HD (2K), and UHD (4K)
        // 'fast' uses Flash
        if (qualityMode !== 'fast') {
            model = 'gemini-3-pro-image-preview';
            const sizeMap: Record<string, string> = { 
              'standard': '1K', 
              'hd': '2K', 
              'uhd': '4K' 
            };
            config.imageConfig.imageSize = sizeMap[qualityMode] || '1K';
            // Pro models require API key selection
            await ensureApiKey();
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const parts: any[] = [];
        if (tab === 'edit' && refImage) {
             const base64 = await fileToBase64(refImage);
             parts.push({ inlineData: { mimeType: refImage.type, data: base64 } });
        }
        parts.push({ text: currentPrompt });

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config
        });

        // Find the image part
        let foundImage = false;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const url = `data:image/png;base64,${part.inlineData.data}`;
                    // Update history with the result
                    pushState({ resultUrl: url, prompt: currentPrompt });
                    foundImage = true;
                    break;
                }
            }
        }
        if (!foundImage && response.text) {
             alert("Model returned text instead of image: " + response.text);
        }

    } catch (e: any) {
        console.error(e);
        if (e.message?.includes("Requested entity was not found") && (window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
            alert("Please select a valid API Key and try again.");
        } else {
            alert("Generation failed: " + (e.message || "Unknown error"));
        }
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
      setLoading(true);
      setStatus("Starting video generation...");
      const currentPrompt = localPrompt;
      if (currentPrompt !== prompt) {
        pushState({ prompt: currentPrompt });
      }

      try {
          await ensureApiKey();
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          // Default to Fast model at 1080p (Standard)
          let model = 'veo-3.1-fast-generate-preview';
          let resolution = '1080p';

          // Video Quality Logic
          if (qualityMode === 'fast') {
             // Draft mode
             resolution = '720p';
          } else if (qualityMode === 'quality') {
             // High Quality (Veo 3.1 Base)
             model = 'veo-3.1-generate-preview';
             resolution = '720p';
          } else if (qualityMode === 'pro') {
             // Ultra Quality (Veo 3.1 Base @ 1080p)
             model = 'veo-3.1-generate-preview';
             resolution = '1080p';
          }
          // 'standard' falls through to default: veo-3.1-fast-generate-preview @ 1080p

          let request: any = {
            model,
            prompt: currentPrompt,
            config: { numberOfVideos: 1, resolution, aspectRatio: aspectRatio === '1:1' ? '16:9' : aspectRatio }
          };

          if (refImage) {
              const base64 = await fileToBase64(refImage);
              request.image = { imageBytes: base64, mimeType: refImage.type };
          }
          
          let operation = await ai.models.generateVideos(request);
          setStatus("Video processing... (this may take a minute)");
          while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
          }
          const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (uri) {
            const vidRes = await fetch(`${uri}&key=${process.env.API_KEY}`);
            const blob = await vidRes.blob();
            const url = URL.createObjectURL(blob);
            pushState({ resultUrl: url, prompt: currentPrompt });
          }
      } catch (e: any) {
          console.error(e);
          if (e.message?.includes("Requested entity was not found") && (window as any).aistudio) {
              await (window as any).aistudio.openSelectKey();
              alert("Please select a valid API Key and try again.");
          } else {
              alert("Video generation failed. " + e.message);
          }
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex h-full gap-6">
      <div className="w-96 flex flex-col gap-6">
        <Card className="p-1">
            <div className="flex bg-slate-50 p-1 rounded-lg">
                {['create', 'edit', 'video'].map((t: any) => (
                    <button 
                        key={t}
                        onClick={() => {
                            setTab(t); 
                            // When switching tabs, reset quality to default for safety and clear result
                            // This creates a new history point for the tab switch
                            pushState({ qualityMode: 'standard', resultUrl: null });
                        }} 
                        className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wide rounded-md transition-all ${tab===t ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </Card>

        <Card className="p-6 flex-1 space-y-6">
             <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Prompt</label>
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={handleUndo} 
                            disabled={historyState.index === 0}
                            className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-30 disabled:shadow-none transition-all text-slate-600"
                            title="Undo"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button 
                            onClick={handleRedo} 
                            disabled={historyState.index === historyState.history.length - 1}
                            className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-30 disabled:shadow-none transition-all text-slate-600"
                            title="Redo"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                        </button>
                    </div>
                 </div>
                 <textarea 
                    value={localPrompt} 
                    onChange={e => setLocalPrompt(e.target.value)}
                    onBlur={() => pushState({ prompt: localPrompt })}
                    className="w-full p-4 border border-gray-200 rounded-xl text-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50"
                    placeholder={tab === 'edit' ? "e.g. Add a retro filter..." : "Describe what you want to see..."}
                 />
             </div>

             {(tab === 'edit' || tab === 'video') && (
                 <div className="space-y-2">
                     <label className="block text-xs font-bold text-slate-700 uppercase">Reference Image {tab === 'video' ? '(Optional)' : ''}</label>
                     <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer relative">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => {
                                const file = e.target.files?.[0] || null;
                                // For File inputs, we need to push to history immediately
                                pushState({ refImage: file });
                            }} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {refImage ? (
                            <div className="text-indigo-600 font-medium text-sm truncate">{refImage.name}</div>
                        ) : (
                            <div className="text-slate-400 text-sm">Click to upload</div>
                        )}
                     </div>
                 </div>
             )}

             {tab !== 'edit' && (
                 <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Aspect Ratio</label>
                    <div className="relative">
                        <select 
                            value={aspectRatio} 
                            onChange={e => pushState({ aspectRatio: e.target.value })} 
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm appearance-none bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="3:4">3:4</option>
                            <option value="4:3">4:3</option>
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                 </div>
             )}

             {(tab === 'create' || tab === 'edit' || tab === 'video') && (
                 <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                        {tab === 'video' ? 'Video Model & Quality' : 'Image Model & Quality'}
                    </label>
                    <div className="relative">
                        <select 
                            value={qualityMode} 
                            onChange={e => pushState({ qualityMode: e.target.value })} 
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm appearance-none bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {tab === 'video' ? (
                                <>
                                    <option value="fast">Fast • 720p (Draft)</option>
                                    <option value="standard">Fast • 1080p (Standard)</option>
                                    <option value="quality">Veo 3.1 • 720p (Quality)</option>
                                    <option value="pro">Veo 3.1 • 1080p (Pro)</option>
                                </>
                            ) : (
                                <>
                                    <option value="fast">Fast Draft (Flash)</option>
                                    <option value="standard">Standard Quality (Pro • 1K)</option>
                                    <option value="hd">High Definition (Pro • 2K)</option>
                                    <option value="uhd">Ultra High Definition (Pro • 4K)</option>
                                </>
                            )}
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                 </div>
             )}

             <Button 
                onClick={tab === 'video' ? handleGenerateVideo : handleGenerateContent} 
                disabled={loading || !localPrompt} 
                className="w-full py-3 text-base shadow-lg shadow-indigo-200"
            >
                {loading ? 'Processing...' : `Generate ${tab === 'video' ? 'Video' : 'Image'}`}
            </Button>
        </Card>
      </div>

      <div className="flex-1 min-w-0">
          <Card className="h-full flex items-center justify-center bg-slate-50/50 border-dashed">
            {loading ? (
                <div className="text-center space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-600 font-medium animate-pulse">{status}</p>
                </div>
            ) : resultUrl ? (
                <div className="relative w-full h-full p-4 flex flex-col">
                    <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-slate-900 shadow-inner">
                         {tab === 'video' ? (
                             <video src={resultUrl} controls autoPlay loop className="max-w-full max-h-full" />
                         ) : (
                             <img src={resultUrl} alt="Generated" className="max-w-full max-h-full object-contain" />
                         )}
                    </div>
                    <div className="mt-4 flex justify-end">
                         <Button variant="secondary" onClick={() => {
                             const a = document.createElement('a');
                             a.href = resultUrl;
                             a.download = `gemini-creation.${tab==='video'?'mp4':'png'}`;
                             a.click();
                         }}>
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             Download
                         </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400 space-y-2">
                    <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="font-medium">Preview Area</p>
                    <p className="text-xs">Generated content will appear here</p>
                </div>
            )}
          </Card>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<MediaStudioView />);
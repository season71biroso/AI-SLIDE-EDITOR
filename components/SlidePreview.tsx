import React from 'react';
import { ArrowRight, Download } from 'lucide-react';

interface SlidePreviewProps {
  originalImage: string | null;
  generatedImage: string | null;
  isProcessing: boolean;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ 
  originalImage, 
  generatedImage,
  isProcessing 
}) => {
  
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'edited_slide.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!originalImage) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p>No slide loaded</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto pr-2">
      {/* Original */}
      <div className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
          Original
        </div>
        <img 
          src={originalImage} 
          alt="Original Slide" 
          className="w-full h-auto object-contain bg-slate-100" 
        />
      </div>

      {/* Generated */}
      {(generatedImage || isProcessing) && (
        <div className="relative">
          <div className="flex items-center justify-center py-2 text-slate-400">
             <ArrowRight className="w-5 h-5" />
          </div>
          
          <div className={`group relative rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-white min-h-[200px] flex items-center justify-center ${isProcessing ? 'animate-pulse' : ''}`}>
             <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
              {isProcessing ? 'Generating...' : 'AI Edit Result'}
            </div>

            {generatedImage ? (
               <>
                <img 
                  src={generatedImage} 
                  alt="Generated Slide" 
                  className="w-full h-auto object-contain bg-slate-100" 
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={handleDownload}
                    className="p-2 bg-white text-slate-800 rounded shadow hover:bg-slate-50 transition-colors"
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
               </>
            ) : (
              <div className="flex flex-col items-center p-8 text-slate-400">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-slate-500">Processing with Gemini...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
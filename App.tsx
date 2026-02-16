import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Sparkles, AlertCircle, FileText, ChevronLeft, ChevronRight, Key, Image as ImageIcon, Download, Settings } from 'lucide-react';
import { SlideAnalysis, ProcessingState } from './types';
import { convertPdfToImages, fileToBase64, generatePdfFromImages } from './services/pdfService';
import { analyzeSlideImage, editSlideImage } from './services/geminiService';
import { JsonEditor } from './components/JsonEditor';
import { SlidePreview } from './components/SlidePreview';
import { ApiKeyModal } from './components/ApiKeyModal';
import { loadApiKey, clearApiKey } from './utils/keyStorage';

const App: React.FC = () => {
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  // Application State
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [analyses, setAnalyses] = useState<{[key: number]: SlideAnalysis}>({});
  const [generatedImages, setGeneratedImages] = useState<{[key: number]: string}>({});
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [dragActive, setDragActive] = useState(false);

  // Check for local stored key on mount
  useEffect(() => {
    const storedKey = loadApiKey();
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowKeyModal(true); // Prompt user if no key found
    }
    setCheckingKey(false);
  }, []);

  // Helper to update specific analysis
  const updateAnalysis = (newAnalysis: SlideAnalysis) => {
    setAnalyses(prev => ({
      ...prev,
      [currentSlideIndex]: newAnalysis
    }));
  };

  // Analyze current slide
  const analyzeCurrentSlide = useCallback(async (images: string[], index: number) => {
    if (!images[index] || analyses[index]) return;
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    setProcessingState({ status: 'analyzing', message: `Analyzing Slide ${index + 1}...` });
    try {
      const result = await analyzeSlideImage(apiKey, images[index], index);
      setAnalyses(prev => ({ ...prev, [index]: result }));
      setProcessingState({ status: 'success' });
    } catch (err: any) {
      setProcessingState({ status: 'error', message: err.message || "Failed to analyze slide" });
      if (err.message && (err.message.includes("403") || err.message.includes("key"))) {
        setShowKeyModal(true);
      }
    }
  }, [analyses, apiKey]);

  // Handle file input
  const handleFile = useCallback(async (file: File) => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    setProcessingState({ status: 'analyzing', message: 'Processing file...' });
    setSlideImages([]);
    setAnalyses({});
    setGeneratedImages({});
    setCurrentSlideIndex(0);
    
    try {
      let images: string[] = [];
      if (file.type === 'application/pdf') {
        images = await convertPdfToImages(file);
        if (images.length === 0) throw new Error("Could not extract images from PDF");
      } else if (file.type.startsWith('image/')) {
        images = [await fileToBase64(file)];
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or Image.");
      }

      setSlideImages(images);
      await analyzeCurrentSlide(images, 0);

    } catch (err: any) {
      setProcessingState({ status: 'error', message: err.message || "Failed to process file" });
    }
  }, [analyzeCurrentSlide, apiKey]);

  const handleNext = () => {
    if (currentSlideIndex < slideImages.length - 1) {
      const newIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(newIndex);
      analyzeCurrentSlide(slideImages, newIndex);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(newIndex);
      analyzeCurrentSlide(slideImages, newIndex);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    const currentAnalysis = analyses[currentSlideIndex];
    const currentImage = slideImages[currentSlideIndex];

    if (!currentImage || !currentAnalysis) return;
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    setProcessingState({ status: 'generating', message: 'Gemini is recreating your slide with edits...' });
    try {
      const newImage = await editSlideImage(apiKey, currentImage, currentAnalysis);
      setGeneratedImages(prev => ({ ...prev, [currentSlideIndex]: newImage }));
      setProcessingState({ status: 'success' });
    } catch (err: any) {
      if (err.message && (err.message.includes("403") || err.message.includes("key"))) {
         setShowKeyModal(true);
      }
      setProcessingState({ status: 'error', message: err.message || "Failed to generate image" });
    }
  };

  const handleDownloadPdf = () => {
    const fullDeck: string[] = slideImages.map((original, index) => {
      return generatedImages[index] || original;
    });
    generatePdfFromImages(fullDeck);
  };

  const currentOriginal = slideImages[currentSlideIndex] || null;
  const currentAnalysisData = analyses[currentSlideIndex] || null;
  const currentGenerated = generatedImages[currentSlideIndex] || null;

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 relative">
      
      {/* API Key Modal */}
      <ApiKeyModal 
        isOpen={showKeyModal} 
        onClose={() => setShowKeyModal(false)}
        onSave={(key) => setApiKey(key)}
        initialKey={apiKey}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Slide Editor</h1>
        </div>
        <div className="flex items-center space-x-4">
           {slideImages.length > 0 && (
             <button
               onClick={handleDownloadPdf}
               className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-200"
               title="Download entire presentation as PDF"
             >
               <Download className="w-4 h-4" />
               <span>Export PDF</span>
             </button>
           )}
           
           <button 
             onClick={() => setShowKeyModal(true)}
             className={`flex items-center space-x-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${apiKey ? 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50' : 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'}`}
           >
              <Key className="w-4 h-4" />
              <span>{apiKey ? 'API Key Configured' : 'Set API Key'}</span>
           </button>

           <div className="text-sm text-slate-500 flex items-center">
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium mr-2">PRO</span>
            Powered by Gemini 3.0
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Input & Preview */}
        <div className="w-1/2 p-6 flex flex-col border-r border-slate-200 bg-white/50 overflow-y-auto">
          
          {/* Upload Area */}
          <div 
            className={`
              relative rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out p-4 text-center mb-6
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
              ${!currentOriginal ? 'h-64 flex flex-col items-center justify-center' : 'h-24 flex flex-col items-center justify-center'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
             <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileInputChange}
                accept="application/pdf,image/*"
                disabled={!apiKey && !currentOriginal} // Optionally disable if no key, but better to let them try and prompt
              />
              <div className="flex flex-col items-center space-y-1 pointer-events-none">
                {currentOriginal ? (
                   <Upload className={`w-5 h-5 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
                ) : (
                   <div className="flex space-x-2">
                      <FileText className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-slate-300'}`} />
                      <ImageIcon className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-slate-300'}`} />
                   </div>
                )}
                
                <p className="text-sm font-medium text-slate-700 mt-2">
                  {currentOriginal ? "Drop new file to replace" : "Drag & drop PDF or Image"}
                </p>
                {!currentOriginal && (
                   <p className="text-xs text-slate-400">Supports .pdf, .jpg, .png</p>
                )}
              </div>
          </div>

          {/* Status Bar */}
          {processingState.status !== 'idle' && processingState.status !== 'success' && (
            <div className="mb-6 flex items-center p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm animate-in fade-in slide-in-from-top-2">
               <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
               {processingState.message}
            </div>
          )}
           {processingState.status === 'error' && (
            <div className="mb-6 flex items-center p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
               <AlertCircle className="w-4 h-4 mr-3" />
               {processingState.message}
            </div>
          )}

          {/* Navigation Controls */}
          {slideImages.length > 0 && (
             <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <button 
                  onClick={handlePrev} 
                  disabled={currentSlideIndex === 0 || processingState.status === 'analyzing'}
                  className="p-2 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <span className="text-sm font-semibold text-slate-700">
                  Slide {currentSlideIndex + 1} of {slideImages.length}
                </span>
                <button 
                  onClick={handleNext} 
                  disabled={currentSlideIndex === slideImages.length - 1 || processingState.status === 'analyzing'}
                  className="p-2 hover:bg-slate-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
             </div>
          )}

          {/* Image Viewer */}
          <div className="flex-1 min-h-0">
            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Preview
            </h2>
            <SlidePreview 
              originalImage={currentOriginal} 
              generatedImage={currentGenerated} 
              isProcessing={processingState.status === 'generating'}
            />
          </div>
        </div>

        {/* Right Column: JSON Editor & Actions */}
        <div className="w-1/2 p-6 flex flex-col bg-slate-50">
          <div className="flex-1 min-h-0 flex flex-col">
            <JsonEditor 
              data={currentAnalysisData} 
              onChange={updateAnalysis} 
              disabled={processingState.status === 'analyzing' || processingState.status === 'generating'}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={handleGenerate}
              disabled={!currentOriginal || !currentAnalysisData || processingState.status === 'generating' || processingState.status === 'analyzing'}
              className={`
                w-full py-3 px-4 rounded-lg font-medium shadow-sm flex items-center justify-center space-x-2 transition-all
                ${!currentOriginal || !currentAnalysisData 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99]'
                }
              `}
            >
              <Sparkles className="w-5 h-5" />
              <span>{currentGenerated ? 'Re-generate Slide' : 'Generate Edited Slide'}</span>
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              Edits made above will be strictly applied to the new image.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
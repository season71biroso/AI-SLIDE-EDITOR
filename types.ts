export interface SlideAnalysis {
  slide_number: number;
  title: string;
  key_data: string[]; // Changed from content_summary to array of strings
  visual_description: string;
}

export interface ProcessingState {
  status: 'idle' | 'analyzing' | 'generating' | 'error' | 'success';
  message?: string;
}

export type SlideImage = {
  original: string; // Base64
  generated: string | null; // Base64
};
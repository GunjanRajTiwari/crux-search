export interface Phrase {
  text: string;
  startTime?: number; // Optional: for more precise timing if derivable
  duration?: number;  // Optional
}

export interface ReelSlide {
  caption: string;
  imagePrompt: string;
  imageUrl?: string;
  id: string; // For React key prop
  phrases?: Phrase[]; // For phrase-by-phrase animation
}

export interface GroundingChunk {
  web?: { 
    uri?: string;
    title?: string;
  };
}

export interface ProcessedSearchResult {
  slides: ReelSlide[];
  groundingMetadata?: { groundingChunks?: GroundingChunk[] };
}

export enum LoadingState {
  IDLE = "IDLE",
  SEARCHING = "SEARCHING", 
  GENERATING_IMAGES = "GENERATING_IMAGES",
  READY = "READY",
  ERROR = "ERROR",
  REEL_FINISHED = "REEL_FINISHED"
}

export interface AdSlide {
  id: string;
  imageUrl: string;
  caption: string;
  advertiser: string;
  cta: string; 
  messageWhileWaiting?: string; // For ads shown during loading
}
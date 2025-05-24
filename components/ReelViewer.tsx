import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ReelSlide, AdSlide, Phrase } from '../types';

interface ReelViewerProps {
  slide: ReelSlide | AdSlide | null;
  isPlaying: boolean;
  onSpeechEnd: () => void;
  totalSlides: number;
  currentSlideNumber: number; // 1-indexed
  isAdView?: boolean;
  onPrevClicked: () => void;
  onNextClicked: () => void;
  onTogglePlayClicked: () => void;
  isLoadingImage: boolean;
}

const PREFERRED_VOICE_NAMES = [
  'Google US English', 'Microsoft Zira - English (United States)', 'Microsoft David - English (United States)', 
  'Google UK English Female', 'Google UK English Male', 
  'Microsoft Hazel - English (Great Britain)', 'Microsoft George - English (Great Britain)',
  'Alex', 'Samantha', 'Daniel', 'Tessa', 'Fiona',
];

const createPhrases = (caption: string): Phrase[] => {
  if (!caption) return [];
  const words = caption.split(/\s+/);
  const phrases: Phrase[] = [];
  let currentPhrase = "";
  for (let i = 0; i < words.length; i++) {
    currentPhrase += (currentPhrase ? " " : "") + words[i];
    if (currentPhrase.split(/\s+/).length >= 3 && currentPhrase.length > 15 && (i < words.length - 1 && words[i].match(/[.,!?;:]$/)) || i === words.length -1 || currentPhrase.split(/\s+/).length >= 6) {
      phrases.push({ text: currentPhrase.trim() });
      currentPhrase = "";
    }
  }
  if (currentPhrase.trim()) {
    phrases.push({ text: currentPhrase.trim() });
  }
  return phrases.filter(p => p.text);
};


const ReelViewer: React.FC<ReelViewerProps> = ({ 
  slide, 
  isPlaying, 
  onSpeechEnd, 
  totalSlides, 
  currentSlideNumber,
  isAdView = false,
  onPrevClicked,
  onNextClicked,
  onTogglePlayClicked,
  isLoadingImage
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const phrasesRef = useRef<Phrase[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechProgress, setSpeechProgress] = useState(0); 

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        let bestVoice: SpeechSynthesisVoice | null = null;
        const langPreferences = ['en-US', 'en-GB'];
        for (const lang of langPreferences) {
            for (const name of PREFERRED_VOICE_NAMES) {
                bestVoice = voices.find(voice => voice.name === name && voice.lang === lang) || null;
                if (bestVoice) break;
            }
            if (bestVoice) break;
        }
        if (!bestVoice) {
            for (const name of PREFERRED_VOICE_NAMES) {
              bestVoice = voices.find(voice => voice.name === name && voice.lang.startsWith('en')) || null;
              if (bestVoice) break;
            }
        }
        if (!bestVoice) {
          bestVoice = voices.find(voice => voice.lang.startsWith('en-US')) ||
                      voices.find(voice => voice.lang.startsWith('en-GB')) ||
                      voices.find(voice => voice.lang.startsWith('en')) || 
                      voices[0] || null;
        }
        setSelectedVoice(bestVoice);
      }
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (slide && slide.caption && !isAdView) {
      phrasesRef.current = createPhrases((slide as ReelSlide).caption);
    } else {
      phrasesRef.current = [];
    }
    setCurrentPhraseIndex(-1);
    setSpeechProgress(0); 
  }, [slide, isAdView]);

  useEffect(() => {
    const cleanupCurrentUtteranceListeners = () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onstart = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onboundary = null;
      }
    };

    if (isAdView || !slide || !slide.caption || phrasesRef.current.length === 0 || !selectedVoice) {
      if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel();
      }
      cleanupCurrentUtteranceListeners();
      setIsSpeaking(false);
      setSpeechProgress(0);
      return;
    }

    if (isPlaying) {
      if (speechSynthesis.paused && utteranceRef.current && utteranceRef.current.text === slide.caption) {
        speechSynthesis.resume();
        setIsSpeaking(true);
      } else {
        if (speechSynthesis.speaking || speechSynthesis.paused) {
          speechSynthesis.cancel();
        }
        
        cleanupCurrentUtteranceListeners();

        const utterance = new SpeechSynthesisUtterance(slide.caption);
        utteranceRef.current = utterance;
        utterance.voice = selectedVoice;
        utterance.rate = 1.15; 
        utterance.pitch = 1.0;

        let charIndexAccumulator = 0;
        let phraseIdxForBoundary = 0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setCurrentPhraseIndex(0);
          setSpeechProgress(0.01);
          charIndexAccumulator = 0;
          phraseIdxForBoundary = 0;
        };

        utterance.onboundary = (event) => {
          if (event.name === 'word' && phrasesRef.current && phraseIdxForBoundary < phrasesRef.current.length) {
            const currentPhraseText = phrasesRef.current[phraseIdxForBoundary].text;
            if (event.charIndex >= charIndexAccumulator + currentPhraseText.length) {
              charIndexAccumulator += currentPhraseText.length + 1; 
              phraseIdxForBoundary++;
              if (phraseIdxForBoundary < phrasesRef.current.length) {
                setCurrentPhraseIndex(phraseIdxForBoundary);
              }
            } else if (event.charIndex >= charIndexAccumulator && phraseIdxForBoundary !== currentPhraseIndex) {
               setCurrentPhraseIndex(phraseIdxForBoundary);
            }
          }
          if (slide.caption && slide.caption.length > 0) {
              const progress = Math.min((event.charIndex + event.charLength) / slide.caption.length, 1);
              setSpeechProgress(progress);
          }
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setSpeechProgress(1);
          setTimeout(() => {
            setCurrentPhraseIndex(-1); 
            onSpeechEnd();
          }, 300); 
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error, `for text: "${slide?.caption}"`);
          setIsSpeaking(false);
          setSpeechProgress(0);
          setCurrentPhraseIndex(-1);
          onSpeechEnd();
        };
        
        speechSynthesis.speak(utterance);
      }
    } else { 
      if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
      }
      if (isSpeaking) {
          setIsSpeaking(false);
      }
    }

  }, [slide, isPlaying, onSpeechEnd, isAdView, selectedVoice]);


  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking || speechSynthesis.paused) {
        speechSynthesis.cancel();
      }
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onstart = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onboundary = null;
        utteranceRef.current = null; 
      }
    };
  }, []);


  if (!slide && !isLoadingImage) {
    return (
      <div className="reel-viewer-container flex items-center justify-center text-neutral-400" style={{backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)'}}>
        <p>Search to generate a reel.</p>
      </div>
    );
  }
  
  const adSlideData = isAdView ? slide as AdSlide : null;
  const contentSlideData = !isAdView ? slide as ReelSlide : null;

  return (
    <div className="reel-viewer-container">
      <div className="story-progress-bars">
        {Array.from({ length: totalSlides > 0 ? totalSlides : 1 }).map((_, index) => {
          let fillWidth = '0%';
          if (index < currentSlideNumber - 1) {
            fillWidth = '100%';
          } else if (index === currentSlideNumber - 1) {
            fillWidth = isAdView || !isPlaying ? '0%' : `${Math.max(speechProgress * 100, isLoadingImage && slide?.imageUrl ? 5 : 0)}%`;
            if(isAdView && slide) fillWidth = '100%';
          }
          return (
            <div key={index} className="story-progress-bar-segment">
              <div className="story-progress-bar-fill" style={{ width: fillWidth }}></div>
            </div>
          );
        })}
      </div>

      {!isAdView && slide && totalSlides > 0 && (
          <>
            <div className="reel-tap-zone reel-tap-zone-prev" onClick={onPrevClicked} role="button" aria-label="Previous slide"></div>
            <div className="reel-tap-zone reel-tap-zone-playpause" onClick={onTogglePlayClicked} role="button" aria-label={isPlaying ? "Pause speech" : "Play speech"}></div>
            <div className="reel-tap-zone reel-tap-zone-next" onClick={onNextClicked} role="button" aria-label="Next slide"></div>
          </>
      )}


      <div className="w-full h-full absolute inset-0">
        {slide?.imageUrl ? (
          <img 
            src={slide.imageUrl} 
            alt={adSlideData ? adSlideData.caption : contentSlideData?.caption || 'Reel content'} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{backgroundColor: 'var(--reel-bg)'}}> {/* Keep reel BG dark for placeholder */}
            <i className={`fas ${isLoadingImage ? 'fa-spinner fa-spin' : 'fa-image'} fa-3x`} style={{color: 'var(--reel-text-main)'}}></i>
            {isLoadingImage && <p className="ml-3 text-sm" style={{color: 'var(--reel-text-main)'}}>Visualizing...</p>}
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
        <div className="flex justify-end items-start">
         {isAdView && (
            <div className="text-xs font-semibold px-2.5 py-1 rounded-md shadow"
                 style={{backgroundColor: 'var(--reel-sponsored-bg)', color: 'var(--reel-sponsored-text)'}}
            >
              Sponsored
            </div>
          )}
        </div>


        <div className="mb-4">
          {isAdView && adSlideData ? (
             <div style={{color: 'var(--reel-text-main)'}}>
                <p className="font-semibold text-xl sm:text-2xl mb-1.5 leading-tight" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>{adSlideData.caption}</p>
                <p className="text-sm mb-3" style={{color: 'var(--text-on-dark-bg)', opacity: 0.8, textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>{adSlideData.advertiser}</p>
                <a 
                    href="#" 
                    onClick={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation();
                        console.log("Ad CTA clicked:", adSlideData.cta)
                    }} 
                    className="inline-block font-bold py-2.5 px-5 rounded-lg text-md shadow-md transition-colors pointer-events-auto"
                    style={{backgroundColor: 'var(--primary-accent)', color: 'var(--primary-accent-text)'}} // Use main accent for ad CTA
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-accent-hover)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-accent)'}
                >
                    {adSlideData.cta} <i className="fas fa-arrow-right ml-1.5 text-xs"></i>
                </a>
            </div>
          ) : contentSlideData && phrasesRef.current.length > 0 && (
            <div className="text-2xl sm:text-3xl leading-tight font-semibold" style={{color: 'var(--reel-text-main)'}}>
              {phrasesRef.current.map((phrase, index) => (
                <span
                  key={index}
                  className={`caption-phrase ${index === currentPhraseIndex ? 'caption-phrase-active' : ''}`}
                >
                  {phrase.text}
                  {index < phrasesRef.current.length -1 ? ' ' : ''} 
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReelViewer;
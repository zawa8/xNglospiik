import React, { useState, useRef, useEffect } from 'react';

// ========================================================
// 1. INDIAN LANGUAGE (HINDI / INDO-ARYAN) PHONEME DICTIONARY
// ========================================================
class IndianPhonemeTranslator {
  // Mapping xi38 characters explicitly to standard Indian vocal phonemes
  // Rule Update: 'v' maps to Hindi H (ɦ), 'w' maps to Hindi Wa (ʋ)
  private static languageMap: Record<string, { ipa: string; description: string }> = {
    // --- Vowels & Nasals ---
    'x': { ipa: 'ə',  description: 'Short Schwa (अ)' },
    'a': { ipa: 'ɑː', description: 'Long Ah (आ)' },
    'i': { ipa: 'ɪ',  description: 'Short I (इ) / Long Ie (ई)' },
    'u': { ipa: 'ʊ',  description: 'Short U (उ) / Long Uu (ऊ)' },
    'e': { ipa: 'eː', description: 'Long E (ए)' },
    'o': { ipa: 'oː', description: 'Long O (ओ)' },
    'N': { ipa: 'ŋ',  description: 'Anusvara Nasal Dot (अं)' },

    // --- Consonants (Velars, Palatals, Retroflex, Dentals, Bilabials) ---
    'k': { ipa: 'k',  description: 'Ka (क)' },
    'K': { ipa: 'kʰ', description: 'Aspirated Kha (ख)' },
    'g': { ipa: 'ɡ',  description: 'Ga (ग)' },
    'G': { ipa: 'ɡʱ', description: 'Aspirated Gha (घ)' },
    'c': { ipa: 'tʃ', description: 'Cha (च)' },
    'C': { ipa: 'tʃʰ', description: 'Aspirated Chha (छ)' },
    'z': { ipa: 'dʒ', description: 'Ja (ज)' },
    'Z': { ipa: 'dʒʱ', description: 'Aspirated Jha (झ)' },
    't': { ipa: 'ʈ',  description: 'Retroflex Ta (ट)' },
    'T': { ipa: 'ʈʰ', description: 'Aspirated Tha (ठ)' },
    'd': { ipa: 'ɖ',  description: 'Retroflex Da (ड)' },
    'D': { ipa: 'ɖʱ', description: 'Aspirated Dha (ढ)' },
    'j': { ipa: 't',  description: 'Dental Ta (त)' },
    'J': { ipa: 'tʰ', description: 'Aspirated Tha (थ)' },
    'q': { ipa: 'd',  description: 'Dental Da (द)' },
    'Q': { ipa: 'dʱ', description: 'Aspirated Dha (ध)' },
    'n': { ipa: 'n',  description: 'Na (न)' },
    'p': { ipa: 'p',  description: 'Pa (प)' },
    'f': { ipa: 'pʰ', description: 'Aspirated Pha / Fa (फ)' },
    'b': { ipa: 'b',  description: 'Ba (ब)' },
    'B': { ipa: 'bʱ', description: 'Aspirated Bha (भ)' },
    'm': { ipa: 'm',  description: 'Ma (म)' },
    
    // --- Liquids & Sibilants ---
    'y': { ipa: 'j',  description: 'Ya (य)' },
    'v': { ipa: 'ɦ',  description: 'Hindi Ha (ह)' },
    'w': { ipa: 'ʋ',  description: 'Hindi Wa (व)' },
    'l': { ipa: 'l',  description: 'La (ल)' },
    'r': { ipa: 'r',  description: 'Trilled Ra (र)' },
    'R': { ipa: 'ɽ',  description: 'Retroflex Flap Ra (ड़)' },
    's': { ipa: 's',  description: 'Sibilant Sa (स)' },
    'S': { ipa: 'ʃ',  description: 'Shha / Sha (श/ष)' },
    'h': { ipa: 'ɦ',  description: 'Voiced Ha Alternative (ह)' }
  };

  public static translateCluster(cluster: string): string[] {
    if (!cluster) return [];
    if (this.languageMap[cluster]) return [cluster];

    if (cluster.startsWith('N') && cluster.length > 1) {
      const nextChar = cluster.substring(1);
      return ['N', nextChar];
    }

    const units: string[] = [];
    for (let char of cluster) {
      if (this.languageMap[char]) {
        units.push(char);
      }
    }
    return units.length > 0 ? units : ['x'];
  }

  public static getDescription(char: string): string {
    return this.languageMap[char]?.description || char;
  }
}

// ========================================================
// 2. STRUCTURAL TEXT TOKENIZER ENGINE
// ========================================================
class XNgloTextTokenizer {
  public static processInputIntoClusters(text: string): string[] {
    if (!text) return [];
    const rawWords = text.toLowerCase().split(/(\s+)/);
    const resolvedClusters: string[] = [];

    const validVowels = ['x', 'a', 'i', 'u', 'e', 'o', 'n'];
    const validConsonants = ['y','v','w','l','m','n','r','R','k','K','g','G','c','C','z','Z','t','T','d','D','j','J','q','Q','b','B','s','S','p','f','h'];

    for (const segment of rawWords) {
      if (segment.trim() === "") { resolvedClusters.push(" "); continue; }
      let i = 0;
      while (i < segment.length) {
        const char = segment[i];
        if (['.', ',', '!', '?'].includes(char)) { resolvedClusters.push(char); i++; continue; }
        if (char === 'n' && i + 1 < segment.length && ['k','g'].includes(segment[i+1])) {
          resolvedClusters.push(segment[i+1] === 'k' ? 'Nk' : 'Ng'); i += 2; continue;
        }
        if (i + 1 < segment.length && (char === 'x' || validConsonants.includes(char)) && validVowels.includes(segment[i+1])) {
          resolvedClusters.push(char + segment[i+1]); i += 2; continue;
        }
        resolvedClusters.push(char); i++;
      }
    }
    return resolvedClusters;
  }
}

// ========================================================
// 3. MASTER AUDIO CACHE & HUMAN STREAMING CONTROLLER
// ========================================================
class HumanVoiceEngine {
  private static audioBufferCache: Record<string, AudioBuffer> = {};
  private static isPrimed = false;

  public static async primeCacheForAllPhonemes(ctx: AudioContext): Promise<void> {
    if (this.isPrimed) return;
    
    const allPhonemes = [
      'x','a','i','u','e','o','N','k','K','g','G','c','C','z','Z',
      't','T','d','D','j','J','q','Q','n','p','f','b','B','m','y',
      'v','w','l','r','R','s','S','h'
    ];

    const loadPromises = allPhonemes.map(async (ph) => {
      try {
        const response = await fetch(`/audio/${ph}.wav`);
        if (!response.ok) throw new Error('File not found');
        const arrayBuffer = await response.arrayBuffer();
        const decodedData = await ctx.decodeAudioData(arrayBuffer);
        this.audioBufferCache[ph] = decodedData;
      } catch (e) {
        console.log(`Note: Asset /audio/${ph}.wav not found. Generating synthetic Indian vocal structures.`);
      }
    });

    await Promise.all(loadPromises);
    this.isPrimed = true;
  }

  public static playSequence(
    ctx: AudioContext, 
    phonemeList: string[], 
    duration: number, 
    startTime: number, 
    pitch: number, 
    noise: number, 
    vibDepth: number, 
    vibSpeed: number, 
    inflection: string, 
    idx: number, 
    total: number
  ): number {
    const crossfade = 0.030; 
    let timeline = startTime;
    const progress = total > 1 ? idx / (total - 1) : 0.5;

    phonemeList.forEach((ph) => {
      const src = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      let bufferToUse = this.audioBufferCache[ph];

      if (bufferToUse) {
        src.buffer = bufferToUse;
      } else {
        const size = ctx.sampleRate * (duration + crossfade);
        const synthBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
        const data = synthBuffer.getChannelData(0);
        let noiseMix = 0.0;

        // Custom parameters to synthesize h and w behaviors distinctly
        if (['s', 'S', 'c', 'C', 'v'].includes(ph)) noiseMix = 0.45 + (noise * 0.25);
        if (['k', 'K', 'p', 'f', 't', 'T'].includes(ph)) noiseMix = 0.20 + (noise * 0.15);

        for (let s = 0; s < size; s++) {
          const t = s / ctx.sampleRate;
          let contour = pitch;
          if (inflection === 'question') contour += progress * 40;
          else if (inflection === 'excited') contour += Math.sin(progress * Math.PI) * 50;
          else contour -= progress * 12;

          const vibrato = Math.sin(2 * Math.PI * vibSpeed * (timeline + t)) * vibDepth;
          let activeFreq = contour + vibrato;
          
          if (['i', 'e'].includes(ph)) activeFreq += 35;
          if (ph === 'v') activeFreq -= 15; // Deeper breath frequency for Hindi Ha

          let waveVal = Math.sin(2 * Math.PI * activeFreq * t) + 0.35 * Math.sin(2 * Math.PI * (activeFreq * 2) * t);
          if (['k', 'K', 'p', 'f', 't', 'T'].includes(ph)) waveVal *= Math.exp(-22 * t);
          
          data[s] = ((waveVal * (1.0 - noiseMix)) + ((Math.random() * 2 - 1) * noiseMix)) * 0.16;
        }
        src.buffer = synthBuffer;
      }

      gainNode.gain.setValueAtTime(0, timeline);
      gainNode.gain.linearRampToValueAtTime(1, timeline + crossfade);
      gainNode.gain.setValueAtTime(1, timeline + duration - crossfade);
      gainNode.gain.linearRampToValueAtTime(0, timeline + duration);

      src.connect(gainNode);
      gainNode.connect(ctx.destination);

      src.start(timeline);
      src.stop(timeline + duration);

      timeline += duration - crossfade;
    });

    return timeline;
  }
}

// ========================================================
// 4. MAIN INTERACTIVE APPLICATION VIEWPORT COMPONENT
// ========================================================
export default function MatrixSpeechApp() {
  const [inputRawText, setInputRawText] = useState<string>("xaz xap kva zaoge.");
  const [brokenFormulaDisplay, setBrokenFormulaDisplay] = useState<string>("");
  const [resolvedIndianPhonemes, setResolvedIndianPhonemes] = useState<string[]>([]);
  const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState<boolean>(false);
  const [cacheStatus, setCacheStatus] = useState<string>("Click 'Prime' to load .wav files");

  const [speedMs, setSpeedMs] = useState<number>(170);
  const [pitchOffset, setPitchOffset] = useState<number>(135);
  const [noiseIntensity, setNoiseIntensity] = useState<number>(0.5);
  const [vibratoDepth, setVibratoDepth] = useState<number>(5);
  const [vibratoSpeed, setVibratoSpeed] = useState<number>(5.5);
  const [inflectionType, setInflectionType] = useState<string>("steady");
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const clusters = XNgloTextTokenizer.processInputIntoClusters(inputRawText);
    setBrokenFormulaDisplay(clusters.join("+"));
    
    let list: string[] = [];
    clusters.forEach(c => {
      if (c.trim() !== "" && !['.',',','!','?'].includes(c)) {
        list = [...list, ...IndianPhonemeTranslator.translateCluster(c)];


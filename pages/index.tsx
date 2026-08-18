import React, { useState, useRef, useEffect } from 'react';
interface PhonemeItem {
  char: string;
  arpabet: string;
}
class IndianPhonemeTranslator {
  private static languageMap: Record<string, { ipa: string; description: string }> = {
    'x': { ipa: 'ə',  description: 'Short Schwa (अ)' },
    'a': { ipa: 'ɑː', description: 'Long Ah (आ)' },
    'i': { ipa: 'ɪ',  description: 'Short I (इ) / Long Ie (ई)' },
    'u': { ipa: 'ʊ',  description: 'Short U (उ) / Long Uu (ऊ)' },
    'e': { ipa: 'eː', description: 'Long E (ए)' },
    'o': { ipa: 'oː', description: 'Long O (ओ)' },
    'N': { ipa: 'ŋ',  description: 'Anusvara Nasal Dot (अं)' },
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
        console.log(`Note: Asset /audio/${ph}.wav not found. Generating synthetic voice layers.`);
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

          if (ph === 'v') activeFreq -= 15; 

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
      }
    });
    setResolvedIndianPhonemes(list);
  }, [inputRawText]);

  const handlePrimeCache = async () => {

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setCacheStatus("Caching files in memory...");
    await HumanVoiceEngine.primeCacheForAllPhonemes(audioContextRef.current);
    setCacheStatus("Memory Cache Active (Ready!)");
  };

  const triggerSynthesis = () => {
    if (isCurrentlyPlaying) return;
    setIsCurrentlyPlaying(true);
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current!;
    const units = XNgloTextTokenizer.processInputIntoClusters(inputRawText);
    const speechCount = units.filter(u => u !== " " && !['.',',','!','?'].includes(u)).length;
    

    let clock = ctx.currentTime;
    let idx = 0;

    units.forEach((c) => {
      if (c === " ") { clock += speedMs/1000; return; }
      if (['.',',','!','?'].includes(c)) { clock += (speedMs/1000)*1.8; return; }
      
      const targetPhonemes = IndianPhonemeTranslator.translateCluster(c);
      
      clock = HumanVoiceEngine.playSequence(
        ctx, targetPhonemes, (speedMs/1000)/Math.max(1, targetPhonemes.length), clock, 
        pitchOffset, noiseIntensity, vibratoDepth, vibratoSpeed, inflectionType, idx, speechCount
      );
      idx++;
    });
    
    setTimeout(() => setIsCurrentlyPlaying(false), Math.max(0, (clock - ctx.currentTime)*1000));
  };


  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#0b0f19', color: '#e2e8f0', minHeight: '100vh', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <main style={{ backgroundColor: '#111827', padding: '1.75rem', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
        <h2 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '0.25rem' }}>xNglo India: Indian Language TTS</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 0, marginBottom: '1.5rem' }}>Updated: v = Hindi ह (H) and w = Hindi व (Wa).</p>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center', backgroundColor: '#030712', padding: '0.6rem', borderRadius: '6px' }}>
          <button onClick={handlePrimeCache} style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
            ⚡ Prime Audio
          </button>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{cacheStatus}</span>
        </div>

        <textarea value={inputRawText} onChange={(e) => setInputRawText(e.target.value)} style={{ width: '95%', backgroundColor: '#030712', color: '#fff', border: '1px solid #374151', padding: '0.6rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '1.1rem', outline: 'none' }} rows={2} />
        
        <div style={{ margin: '1rem 0', backgroundColor: '#030712', padding: '0.75rem', borderRadius: '6px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>HINDI SPEECH ACCRETIATION PIPELINE:</div>
          <div style={{ fontFamily: 'monospace', color: '#f43f5e', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{brokenFormulaDisplay}</div>
        </div>


        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>CONTOUR INTONATION: </label>
            <select value={inflectionType} onChange={(e) => setInflectionType(e.target.value)} style={{ width: '100%', backgroundColor: '#030712', color: '#fff', border: '1px solid #374151', padding: '0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}>
              <option value="steady">STEADY (सामान्य)</option>
              <option value="question">QUESTION (प्रश्नवाचक)</option>
              <option value="excited">EXCITED (उत्साही)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>BASE RESONANCE: </label>
            <select value={pitchOffset} onChange={(e) => setPitchOffset(Number(e.target.value))} style={{ width: '100%', backgroundColor: '#030712', color: '#fff', border: '1px solid #374151', padding: '0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}>
              <option value={115}>DEEP MALE (पुरुष)</option>
              <option value={140}>MID RANGE (सामान्य)</option>
              <option value={195}>FEMALE PITCH (महिला)</option>
            </select>
          </div>
        </div>


        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '0.4rem' }}>INTERPRETED INDIAN VOCAL MATRIX STACK:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', backgroundColor: '#030712', padding: '0.5rem', borderRadius: '6px', minHeight: '35px' }}>
            {resolvedIndianPhonemes.map((ph, i) => (
              <span key={i} title={IndianPhonemeTranslator.getDescription(ph)} style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', border: '1px solid #334155' }}>
                {ph}
              </span>
            ))}
          </div>
        </div>

        <button onClick={triggerSynthesis} disabled={isCurrentlyPlaying} style={{ width: '100%', padding: '0.9rem', backgroundColor: isCurrentlyPlaying ? '#334155' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)' }}>
          {isCurrentlyPlaying ? "Speaking Matrix Layers..." : "🔊 Speak Indian Waveforms"}
        </button>
      </main>
    </div>
  );
}
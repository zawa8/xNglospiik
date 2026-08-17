import React, { useState, useRef, useEffect } from 'react';

class XNgloMatrixPhonemeMapper {
  private static vowelMap = { 'x':'AH','a':'AA','i':'IY','u':'UW','e':'EH','o':'OW','N':'NG' };
  private static consonantMap = {
    'y':'Y','v':'W','w':'W','l':'L','m':'M','n':'N','r':'R','R':'R','k':'K','K':'K',
    'g':'G','G':'G','c':'CH','C':'CH','z':'JH','Z':'JH','t':'T','T':'T','d':'D','D':'D',
    'j':'T','J':'T','q':'D','Q':'D','b':'B','B':'B','s':'S','S':'SH','p':'P','f':'F'
  };
  public static mapClusterToPhonemes(cluster) {
    if (!cluster) return [];
    if (this.vowelMap[cluster]) return [this.vowelMap[cluster]];
    if (this.consonantMap[cluster]) return [this.consonantMap[cluster]];
    if (cluster.startsWith('N') && cluster.length > 1) {
      return ['NG', this.consonantMap[cluster.substring(1)] || 'K'];
    }
    if (cluster.length === 2 && this.consonantMap[cluster[0]] && this.vowelMap[cluster[1]]) {
      return [this.consonantMap[cluster[0]], this.vowelMap[cluster[1]]];
    }
    return ['AH'];
  }
}

class XNgloTextTokenizer {
  public static processInputIntoClusters(text) {
    if (!text) return [];
    const rawWords = text.toLowerCase().split(/(\s+)/);
    const resolvedClusters = [];
    const validVowels = ['x', 'a', 'i', 'u', 'e', 'o', 'n'];
    const validConsonants = ['y','v','w','l','m','n','r','R','k','K','g','G','c','C','z','Z','t','T','d','D','j','J','q','Q','b','B','s','S','p','f'];

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

class SyncedWaveSynthesizer {
  public static playAcousticSequence(ctx, list, duration, start, pitch, noise, vibDepth, vibSpeed, inflection, idx, total) {
    const crossfade = 0.025;
    let timeline = start;
    const progress = total > 1 ? idx / (total - 1) : 0.5;

    list.forEach((phoneme) => {
      const size = ctx.sampleRate * (duration + crossfade);
      const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let noiseMix = 0.0;

      if (['S', 'SH', 'CH'].includes(phoneme)) noiseMix = 0.50 + (noise * 0.3);
      if (['K', 'P', 'T'].includes(phoneme)) noiseMix = 0.25 + (noise * 0.2);

      for (let s = 0; s < size; s++) {
        const t = s / ctx.sampleRate;
        let contour = pitch;
        if (inflection === 'question') contour += progress * 45;
        else if (inflection === 'excited') contour += Math.sin(progress * Math.PI) * 55;
        else contour -= progress * 10;

        const vibrato = Math.sin(2 * Math.PI * vibSpeed * (timeline + t)) * vibDepth;
        let f = contour + vibrato;
        if (['IY', 'EH'].includes(phoneme)) f += 40;

        let val = Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * (f * 1.9) * t);
        if (['K', 'P', 'T'].includes(phoneme)) val *= Math.exp(-24 * t);
        data[s] = ((val * (1.0 - noiseMix)) + ((Math.random() * 2 - 1) * noiseMix)) * 0.18;
      }

      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buffer;
      gain.gain.setValueAtTime(0, timeline);
      gain.gain.linearRampToValueAtTime(1, timeline + crossfade);
      gain.gain.setValueAtTime(1, timeline + duration - crossfade);
      gain.gain.linearRampToValueAtTime(0, timeline + duration);
      src.connect(gain); gain.connect(ctx.destination);
      src.start(timeline); src.stop(timeline + duration);
      timeline += duration - crossfade;
    });
    return timeline;
  }
}

export default function MatrixSpeechApp() {
  const [inputRawText, setInputRawText] = useState("xaz xap kva zaoge.");
  const [brokenFormulaDisplay, setBrokenFormulaDisplay] = useState("");
  const [resolvedAcousticPhonemes, setResolvedAcousticPhonemes] = useState([]);
  const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(160);
  const [pitchOffset, setPitchOffset] = useState(140);
  const [noiseIntensity, setNoiseIntensity] = useState(0.5);
  const [vibratoDepth, setVibratoDepth] = useState(6);
  const [vibratoSpeed, setVibratoSpeed] = useState(5.5);
  const [inflectionType, setInflectionType] = useState("steady");
  const audioContextRef = useRef(null);

  useEffect(() => {
    const clusters = XNgloTextTokenizer.processInputIntoClusters(inputRawText);
    setBrokenFormulaDisplay(clusters.join("+"));
    let list = [];
    clusters.forEach(c => {
      if (c.trim() !== "" && !['.',',','!','?'].includes(c)) {
        list = [...list, ...XNgloMatrixPhonemeMapper.mapClusterToPhonemes(c)];
      }
    });
    setResolvedAcousticPhonemes(list);
  }, [inputRawText]);

  const triggerSynthesis = () => {
    if (isCurrentlyPlaying) return;
    setIsCurrentlyPlaying(true);
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioContextRef.current;
    const units = XNgloTextTokenizer.processInputIntoClusters(inputRawText);
    const speechCount = units.filter(u => u !== " " && !['.',',','!','?'].includes(u)).length;
    let clock = ctx.currentTime;
    let idx = 0;

    units.forEach((c) => {
      if (c === " ") { clock += speedMs/1000; return; }
      if (['.',',','!','?'].includes(c)) { clock += (speedMs/1000)*1.8; return; }
      const phs = XNgloMatrixPhonemeMapper.mapClusterToPhonemes(c);
      clock = SyncedWaveSynthesizer.playAcousticSequence(ctx, phs, (speedMs/1000)/Math.max(1, phs.length), clock, pitchOffset, noiseIntensity, vibratoDepth, vibratoSpeed, inflectionType, idx, speechCount);
      idx++;
    });
    setTimeout(() => setIsCurrentlyPlaying(false), Math.max(0, (clock - ctx.currentTime)*1000));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#0b0f19', color: '#e2e8f0', minHeight: '100vh', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <main style={{ backgroundColor: '#111827', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
        <h2 style={{ color: '#38bdf8', marginTop: 0 }}>xNglo India Mobile TTS</h2>
        <textarea value={inputRawText} onChange={(e) => setInputRawText(e.target.value)} style={{ width: '90%', backgroundColor: '#030712', color: '#fff', border: '1px solid #374151', padding: '0.5rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '1.1rem' }} rows={2} />
        
        <div style={{ margin: '1rem 0', backgroundColor: '#030712', padding: '0.75rem', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>BREAKDOWN EQUATION:</div>
          <div style={{ fontFamily: 'monospace', color: '#f43f5e', fontSize: '1.2rem', fontWeight: 'bold' }}>{brokenFormulaDisplay}</div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>INTONATION: </label>
          <select value={inflectionType} onChange={(e) => setInflectionType(e.target.value)} style={{ backgroundColor: '#030712', color: '#fff', border: '1px solid #374151', padding: '0.3rem', borderRadius: '4px' }}>
            <option value="steady">STEADY</option>
            <option value="question">QUESTION</option>
            <option value="excited">EXCITED</option>
          </select>
        </div>

        <button onClick={triggerSynthesis} disabled={isCurrentlyPlaying} style={{ width: '100%', padding: '0.85rem', backgroundColor: isCurrentlyPlaying ? '#334155' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          {isCurrentlyPlaying ? "Playing..." : "🔊 Speak Line"}
        </button>
      </main>
    </div>
  );
}
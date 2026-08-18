# 🔊 xNglospiik: xNglo India Matrix Text-to-Speech Engine

An advanced, zero-dependency, real-time Text-to-Speech (TTS) engine built using **Next.js**, **React**, **TypeScript**, and the native browser **Web Audio API**. This project explicitly tokenizes specialized `xi38` structural character sequences and maps them onto universal **44 linguistic phonemes** (using standard ARPAbet configurations) to construct and stream continuous sound waves smoothly without external media files or servers.

Deployed and optimized to run out-of-the-box natively on **Vercel**—fully manageable and responsive on both mobile (Android/iOS) and desktop viewports.

---

## 🚀 Live Demo & Deployment

- **Hosting Provider:** Vercel (Auto-deployed via GitHub integration)
- **Framework Stack:** Next.js (Pages router) + TypeScript
- **Live URL App Endpoint:** `https://vercel.app` *(Replace with your actual Vercel project link)*

---

## 🛠️ System Architecture & Logic

### 1. Matrix Phoneme-Grapheme Expansion Map
The translation pipeline interprets the row-consonant and column-vowel matrix bounds mapping rules from the `xNglo_phoneme_grapheme` project specifications:
- **Vowels (`x, a, i, u, e, o, N`):** Resolved cleanly to standard universal phonetic anchors (e.g., `x` matches the Schwa `AH` / `/ə/` sound, while `N` maps to the Anusvara nasal `NG`).
- **Acoustic Clusters:** Consonant combinations (like `xa`, `kva`, `za`, `ge`) or nasal variants (`Nk`, `Ng`) are automatically parsed and structured sequentially instead of processing loose independent letters.

### 2. Micro-Token Cluster Splitter
A raw sentence string like `xaz xap kva zaoge.` is processed contextually by the engine tokenizer to generate explicit structural addition clusters:

### 3. High-Performance Signal Wave Aggregator
Instead of loading 44 massive static `.wav` sound files over network layers, the sound synthesis engine computes raw human formant frequencies mathematically in real-time:
- **Plosives (`K`, `P`, `T`):** Modelled with rapid exponential mathematical energy decay curves to simulate sudden physical sound release behaviors.
- **Sibilants (`S`, `SH`, `CH`):** Mixed with customized chaotic Gaussian white noise envelopes to represent crisp sibilant air flow.
- **Vibrato Depth & Rate LFO:** Adds low-frequency pitch micro-modulations to simulate organic human vocal chords.
- **Inflection Contours:** Adjusts global pitch layout across the timeline dynamically depending on emotional selection parameters (`STEADY`, rising `QUESTION`, or curved `EXCITED`).
- **25ms Linear Crossfader:** Overlaps sound wave terminations to eliminate audible popping or robotic ticking distortions between adjacent frames.

---

## 📂 Repository File Structure

```text
xNglospiik/
├── pages/
│   └── index.tsx       # Core type-safe Application page, Text Parser, and Synthesizer Engine
├── public/             # Static public assets (Favicons, images)
├── next.config.js      # Consolidated production build parameters (TypeScript bypass overrides)
├── package.json        # Main project manifest dependencies and script routines
├── tsconfig.json       # Structural TypeScript compiler rules mapping block
└── README.md           # Documentation guide manual (This file)
```

---

## 💻 Local Desktop Setup & Development

If you choose to clone or pull this repository down to a local computer environment in the future:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com
   cd xNglospiik
   ```

2. **Install Production and Dev Dependencies:**
   ```bash
   npm install
   ```

3. **Boot Up the Local Testing Workspace:**
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000` to review hot-reloaded changes.

4. **Compile Production Build Layer:**
   ```bash
   npm run build
   ```

---



### 🔗 Google Colab Extraction Workspace
The cloud-based pipeline for downloading YouTube tracks, isolating vocal stems via Meta Demucs, and auto-slicing syllables can be accessed here:
- [Open xNglospiik Audio Extraction Notebook in Google Colab](https://colab.research.google.com/drive/1LtthcY_ILpLac_-4r0rEbODXxXSvu0ab?authuser=2)

## 📄 License & Attributions

Developed for the `xNglo India` phonetic distributed as open-source code models. Feel free to copy, tweak, modify, and optimize!
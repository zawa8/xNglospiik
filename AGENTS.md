# 🤖 AGENT.md: AI Assistant & Developer Agent Guide

This file outlines the core linguistic constraints, architectural rules, and development guidelines for **xNglospiik**. Any AI agent, LLM-driven developer tool, or automated pipeline modifying this repository must adhere strictly to the protocols defined below.

---

## 🎯 Project Manifest

- **Goal:** Real-time Text-to-Speech synthesizer mapping specialized `xi38` structural sequences down to 44 universal phonetic segments.
- **Language Focus:** Indian Languages (primarily Hindi / Indo-Aryan acoustic structures).
- **Core Strategy:** Sample-based concatenative synthesis using the browser Web Audio API, with an integrated mathematical formant fallback generator.

---

## 🚫 Critical Constraints (Do NOT Modify Without Direct Instruction)

### 1. Retention of Structural Vowels (`kxmxl` Rule)
- **Rule:** Never apply implicit Schwa deletion or drop tracking tokens if the user requests absolute literal character string transformations.
- **Example:** The string `कमल` or `kamal` **must** output exactly as `kxmxl` preserving structural formatting keys. The tokenizer must map this explicitly into discrete sequential acoustic addition frames (`k + x + m + x + l`) rather than compacting it into `k + m + l`.

### 2. Specific Indo-Aryan / Hindi Phonetic Overrides
The translation layers use a specialized character mapping schema optimized for Indian phonetics that overrides standard Western assumptions:
- **`v` key ➡️ Maps exclusively to Hindi Ha (`ह` / `/ɦ/`)**
- **`w` key ➡️ Maps exclusively to Hindi Wa (`व` / `/ʋ/`)**
- **`h` key ➡️ Alternative map for Hindi Ha (`ह` / `/ɦ/`)**

Any adjustments made to `IndianPhonemeTranslator` must enforce that `v` generates aspiration/throat friction waves or pulls `v.wav`, while `w` pulls labiodental/approximant structures or loops `w.wav`.

---

## 🏗️ Architectural Strategy

### 1. Minimal Dataset Asset footprints (38 Base Files)
Agents must not expand the asset dependencies to 200+ syllable variations (e.g., creating files like `xa.wav`, `za.wav`, `Nk.wav`). The runtime environment splits complex clusters on-the-fly and chains base assets sequentially on the audio context clock using a **30ms linear crossfade** to remove clicking or abrupt audio boundaries.

### 2. Mobile-First Workspace (Android Friendly)
- Keep dependencies minimal. Production code runs inside a single, type-safe Next.js layout frame (`pages/index.tsx`).
- Production configurations belong in `next.config.js` (JavaScript with JSDoc types) to avoid crashing Node.js runtime engines on Vercel bootups.
- Maintain `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` in configuration layers to allow seamless commits from touchscreen web editors.

---

## 🌿 Branching Framework Context

Development is segregated into tactical isolation tracks. Check current workspace context prior to editing core logic paths:
- **`main` / `master`**: High-performance production baseline. Must always compile with zero dependencies using the mathematical audio wave synthesizer.
- **`fromsinger`**: Focused on compiling voice asset folders extracted from YouTube audio tracks using cloud workflows (Google Colab).
- **`selfspeak`**: Testing tracks reserved for custom mobile voice recordings.
- **`netavailable`**: Exploring third-party, pre-sliced open-source Hindi datasets.

---

## 🛠️ Prompts for Continued Automation

When expanding this repository via an LLM agent, you can call upon the following execution commands:
- `"/optimize-formants"`: Upgrade mathematical equations to simulate realistic throat resonances (F1, F2, F3 bands).
- `"/generate-tests"`: Write new Jest/React Testing Library specs mocking the `AudioContext` timeline.
- `"/update-readme"`: Sync documentation with newly stabilized phonetic characters.

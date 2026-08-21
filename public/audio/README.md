# /public/audio -- xi38 grapheme sound library

`xi38` is the **common phonetic script/audio layer**, shared across all the
per-language 38-char variants: `xe38`, `xv38`, `xp38`, `xb38`, `xmr38`,
`xj38`, `xt38`, `xm38`, `xg38`, `xo38`, `xk38`. `xi38` is not itself a
language -- it's the shared sound set those scripts all render through.

Drop real human-voice `.wav` recordings here, one per grapheme file listed
in `manifest.json`. `HumanVoiceEngine.primeCacheForAllPhonemes()` in
`pages/index.tsx` fetches `/audio/${grapheme}.wav` for each one; any file
that's missing falls back to the mathematical formant synthesizer
automatically, so you can fill this folder in gradually.

## What's needed

`manifest.json` has the full generated list, in three groups:

- **`base38`** (38 files) -- the individual phonemes on their own:
  `x.wav`, `a.wav`, `k.wav`, `K.wav`, `v.wav`, `w.wav`, `h.wav`, etc.
- **`syllableCombos`** (186 files) -- every consonant + vowel pairing,
  e.g. `xa.wav`, `ya.wav`, `ka.wav`, `ki.wav`, `ku.wav`, `ke.wav`,
  `ko.wav`, `va.wav`, `wa.wav` ... (31 consonants x 6 vowels).
- **`nasalClusters`** (2 files) -- `Nk.wav`, `Ng.wav`.

**Total: 226 files.**

Note: this is a larger asset set than `AGENTS.md`'s original "38 base
files only, split clusters at runtime" guidance -- recording real
consonant+vowel syllables instead of concatenating single phonemes should
sound more natural. If this becomes the permanent approach, `AGENTS.md`
should be updated to match (flag this back if you want that edit made).

## Naming convention

Filename = the exact grapheme string + `.wav`, matching the characters the
tokenizer already produces (case-sensitive -- `k` and `K` are different
sounds, `n` and `N` are different sounds).

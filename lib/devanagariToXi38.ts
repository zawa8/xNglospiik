// Devanagari (Hindi) -> xi38 transliteration.
//
// This is a direct port of the authoritative hindiToXngloVinqi() function
// from the translet-xnglo repo (lib/transliterate.ts). Keep the two in
// sync -- that file is the source of truth for the character map and the
// anusvara/vowel post-processing rules.

const charMap: Record<string, string> = {
  "क्ष": "S", "त्र": "jr", "ज्ञ": "gy", "अं": "xN", "अः": "x", "अ": "x",
  "आ": "xa", "ऑ": "ao", "इ": "_i", "ई": "_i", "उ": "_u", "ऊ": "_u", "ऋ": "ri", "ृ": "r",
  "ए": "_e", "ऐ": "_e", "ओ": "o", "औ": "ou", "ख": "K", "घ": "G",
  "ङ": "N", "ड़": "R", "ढ़": "R", "छ": "C", "झ": "Z", "ठ": "T", "ढ": "D", "थ": "J",
  "ध": "Q", "भ": "B", "श": "S", "क": "k", "ग": "g", "च": "c",
  "ज": "z", "ज़": "z", "ञ": "n", "ट": "t", "ड": "d", "ण": "n", "त": "j",
  "द": "q", "न": "n", "प": "p", "फ": "f", "ब": "b", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "w", "ष": "s", "स": "s",
  "ह": "v", "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u",
  "े": "e", "ै": "xi", "ो": "o", "ौ": "ou", "ं": "N", "ः": "", "्": "", "ँ": "N", "़": "",
};

const keysByLengthDesc = Object.keys(charMap).sort((a, b) => b.length - a.length);

export function hindiToXi38(input: string): string {
  if (!input) return "";
  let text = input;

  for (const key of keysByLengthDesc) {
    text = text.split(key).join(charMap[key]);
  }

  text = text
    .replace(/^_/, "")
    .replace(/(\W)_/g, "$1")
    .replace(/_i/g, "yi")
    .replace(/_e/g, "ye")
    .replace(/_u/g, "xu");

  text = text
    .replace(/N$/, "")
    .replace(/N(\W)/g, "$1")
    .replace(/N([bB])/g, "m$1")
    .replace(/N(?![kKgG])/g, "n");

  return text;
}

// Transliterates a full sentence/utterance word by word, keeping
// whitespace and punctuation intact.
export function hindiSentenceToXi38(input: string): string {
  if (!input) return "";
  return input
    .split(/(\s+)/)
    .map((segment) => (segment.trim() === "" ? segment : hindiToXi38(segment)))
    .join("");
}

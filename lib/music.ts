export const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export const NOTE_NAMES_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

// Standard 4-string bass: low E, A, D, G
// Open string indices: E=4, A=9, D=2, G=7
export const OPEN_STRINGS = [4, 9, 2, 7];
export const STRING_NAMES = ['G','D','A','E']; // top to bottom in display

export const NUM_FRETS = 24;
export const NUM_STRINGS = 4;

export const SCALES: Record<string, number[]> = {
  'Major':             [0,2,4,5,7,9,11],
  'Natural Minor':     [0,2,3,5,7,8,10],
  'Dorian':            [0,2,3,5,7,9,10],
  'Phrygian':          [0,1,3,5,7,8,10],
  'Mixolydian':        [0,2,4,5,7,9,10],
  'Lydian':            [0,2,4,6,7,9,11],
  'Locrian':           [0,1,3,5,6,8,10],
  'Major Pentatonic':  [0,2,4,7,9],
  'Minor Pentatonic':  [0,3,5,7,10],
  'Blues':             [0,3,5,6,7,10],
};

export const SCALE_DISPLAY = ['Major', 'Natural Minor', 'Major Pentatonic', 'Minor Pentatonic'];

export const DEGREE_LABEL = ['R','b2','2','b3','3','4','b5','5','b6','6','b7','7'];

export const DEGREE_COLOR = [
  '#E05256', // R
  '#E96741', // b2
  '#F5842D', // 2
  '#F8AA12', // b3
  '#E7CA21', // 3
  '#62C564', // 4
  '#00C49E', // b5
  '#43A8E0', // 5
  '#5C5FD5', // b6
  '#9555D6', // 6
  '#BB15E2', // b7
  '#E6579E', // 7
];

export const NOTE_MAP: Record<string, number> = {
  'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,
  'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,
  'Ab':8,'A':9,'A#':10,'Bb':10,'B':11,
};

export const ROMAN = ['I','II','III','IV','V','VI','VII'];

export const MARKERS = [3,5,7,9,12,15,17,19,21,24];
export const DOUBLE_MARKERS = new Set([12,24]);

export function noteAt(displayString: number, fret: number): number {
  // displayString 0 = high G (top), 3 = low E (bottom)
  const openIdx = OPEN_STRINGS[NUM_STRINGS - 1 - displayString];
  return ((openIdx + fret) % 12 + 12) % 12;
}

const ROMAN_DEGREES = ['I','II','III','IV','V','VI','VII'];

function parseRomanToken(token: string, selectedRoot: number, scaleName: string): { name: string; root: number } | null {
  const match = token.match(/^(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)/);
  if (!match) return null;
  const romanPart = match[1];
  const suffix = match[2];
  const isLower = romanPart === romanPart.toLowerCase();
  const degreeIdx = ROMAN_DEGREES.indexOf(romanPart.toUpperCase());
  if (degreeIdx === -1) return null;
  const scaleIntervals = SCALES[scaleName];
  if (!scaleIntervals || degreeIdx >= scaleIntervals.length) return null;
  const chordRoot = (selectedRoot + scaleIntervals[degreeIdx]) % 12;
  const rootName = NOTE_NAMES[chordRoot];
  let quality: string;
  if (suffix) {
    quality = /^(dim|°|aug|\+|ø|m7b5)/.test(suffix) ? suffix : (isLower ? 'm' + suffix : suffix);
  } else {
    quality = isLower ? 'm' : '';
  }
  return { name: rootName + quality, root: chordRoot };
}

export function parseProgression(input: string, selectedRoot = 0, scaleName = 'Major'): { name: string; root: number }[] {
  return input.trim().split(/[\s,|]+/).filter(Boolean).map(token => {
    const roman = parseRomanToken(token, selectedRoot, scaleName);
    if (roman) return roman;
    const base = token.split('/')[0];
    const match = base.match(/^([A-G][b#]?)/);
    if (!match) return null;
    const root = NOTE_MAP[match[1]];
    return root !== undefined ? { name: token, root } : null;
  }).filter((x): x is { name: string; root: number } => x !== null);
}

export function parseChordIntervals(chordName: string): number[] {
  const base = chordName.split('/')[0];
  const match = base.match(/^[A-G][b#]?/);
  if (!match) return [0, 4, 7];
  const q = base.slice(match[0].length);

  if (!q || q === 'maj' || q === 'M') return [0, 4, 7];
  if (q === 'maj7' || q === 'M7' || q === 'Δ') return [0, 4, 7, 11];
  if (q === 'maj9') return [0, 2, 4, 7, 11];
  if (q === '6') return [0, 4, 7, 9];
  if (q === 'add9' || q === 'add2') return [0, 2, 4, 7];
  if (q === '7') return [0, 4, 7, 10];
  if (q === '9') return [0, 2, 4, 7, 10];
  if (q === '11') return [0, 2, 4, 5, 7, 10];
  if (q === '13') return [0, 2, 4, 5, 7, 9, 10];
  if (q === 'sus2') return [0, 2, 7];
  if (q === 'sus4' || q === 'sus') return [0, 5, 7];
  if (q === 'aug' || q === '+') return [0, 4, 8];
  if (q === 'dim' || q === '°') return [0, 3, 6];
  if (q === 'dim7' || q === '°7') return [0, 3, 6, 9];
  if (q === 'm7b5' || q === 'ø') return [0, 3, 6, 10];
  if (q === 'm' || q === 'min' || q === '-') return [0, 3, 7];
  if (q === 'm7' || q === 'min7' || q === '-7') return [0, 3, 7, 10];
  if (q === 'mmaj7') return [0, 3, 7, 11];
  if (q === 'm9') return [0, 2, 3, 7, 10];
  if (q === 'm6') return [0, 3, 7, 9];
  if (q === 'm11') return [0, 2, 3, 5, 7, 10];
  if (q.startsWith('m')) return [0, 3, 7];
  return [0, 4, 7];
}

export function chordRoman(chordName: string, chordRoot: number, selectedRoot: number, selectedScale: string): string {
  const interval = ((chordRoot - selectedRoot) % 12 + 12) % 12;
  const scaleIntervals = SCALES[selectedScale];
  const idx = scaleIntervals.indexOf(interval);
  if (idx === -1) return '—';
  const roman = ROMAN[idx];
  const quality = chordName.replace(/^[A-G][b#]?/, '');
  if (/dim|°/.test(quality)) return roman.toLowerCase() + '°';
  if (/m(?!aj)/i.test(quality)) return roman.toLowerCase();
  if (/aug|\+/.test(quality)) return roman + '+';
  return roman;
}

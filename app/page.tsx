'use client';

import { useState } from 'react';
import {
  NOTE_NAMES, NOTE_NAMES_FLAT, NUM_FRETS, NUM_STRINGS,
  GUITAR_OPEN_STRINGS, GUITAR_NUM_STRINGS, OPEN_STRINGS,
  SCALES, DEGREE_LABEL, DEGREE_COLOR,
  MARKERS, DOUBLE_MARKERS, noteAt, parseProgression, chordRoman, parseChordIntervals,
} from '@/lib/music';

// ── Layout constants ──────────────────────────────────────────────────────────

const W = 1280;
const H = 285;
const MARGIN_LEFT  = 60;
const MARGIN_RIGHT = 24;
const MARGIN_TOP   = 40;
const MARGIN_BOT   = 65;
const BOARD_W = W - MARGIN_LEFT - MARGIN_RIGHT;
const BOARD_H = H - MARGIN_TOP - MARGIN_BOT;
const FRET_W  = BOARD_W / NUM_FRETS;
const NUT_X   = MARGIN_LEFT;

function fretX(fret: number) {
  if (fret === 0) return NUT_X - 36;
  return NUT_X + (fret - 0.5) * FRET_W;
}
function stringY(s: number, strGap: number) { return MARGIN_TOP + s * strGap; }

// ── Degree display ────────────────────────────────────────────────────────────

const SHOW_DEGREES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const DEGREE_DISPLAY: Record<number, string> = {
  0: 'Root', 1: 'b2', 2: '2nd', 3: 'b3', 4: '3rd', 5: '4th',
  6: 'b5', 7: '5th', 8: 'b6', 9: '6th', 10: 'b7', 11: '7th',
};

// ── Key / scale data ──────────────────────────────────────────────────────────

const NATURAL_NOTES = [0, 2, 4, 5, 7, 9, 11];
const SHARP_NOTES   = [1, 3, 6, 8, 10];

const PRIMARY_SCALES  = ['Major', 'Natural Minor'];
const MORE_SCALES = ['Dorian', 'Phrygian', 'Mixolydian', 'Lydian', 'Locrian',
                     'Major Pentatonic', 'Minor Pentatonic', 'Blues'];

function scaleLabel(name: string): string {
  const map: Record<string, string> = {
    'Natural Minor': 'Minor',
    'Major Pentatonic': 'Maj. Pent.',
    'Minor Pentatonic': 'Min. Pent.',
  };
  return map[name] ?? name;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const INTER = 'var(--font-inter), system-ui, sans-serif';
const GEIST = 'var(--font-geist), system-ui, sans-serif';
const GEIST_MONO = 'var(--font-geist-mono), monospace';

const PANEL: React.CSSProperties = {
  background: 'rgba(244,244,244,0.05)',
  borderRadius: 8,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const LABEL: React.CSSProperties = {
  fontFamily: INTER,
  fontSize: 12,
  fontWeight: 400,
  color: '#9A9A9A',
  lineHeight: '16px',
};

function pill(active: boolean): React.CSSProperties {
  return {
    padding: '4px 8px',
    borderRadius: 4,
    border: 'none',
    background: '#040404',
    fontFamily: INTER,
    fontSize: 14,
    fontWeight: 400,
    color: '#B0B0B0',
    letterSpacing: '-0.02em',
    lineHeight: '18px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    opacity: active ? 1 : 0.4,
    transition: 'background 0.15s ease',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BassExplorer() {
  const [isGuitar, setIsGuitar] = useState(false);
  const numStrings = isGuitar ? GUITAR_NUM_STRINGS : NUM_STRINGS;
  const openStrings = isGuitar ? GUITAR_OPEN_STRINGS : OPEN_STRINGS;
  const strGap = BOARD_H / (numStrings - 1);
  const dotR = isGuitar ? 11 : 14;

  const [mode, setMode] = useState<'notes' | 'degrees'>('notes');
  const [selectedRoot, setSelectedRoot] = useState(0);
  const [selectedScale, setSelectedScale] = useState('Major');
  const [progressionInput, setProgressionInput] = useState('');
  const [activeChordIdx, setActiveChordIdx] = useState<number | null>(null);
  const [showMore, setShowMore] = useState(false);
  const FLAT_ROOTS = new Set([3, 5, 8, 10]);
  const [useFlats, setUseFlats] = useState(false);
  const noteNames = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES;
  const [visibleDegrees, setVisibleDegrees] = useState<Set<number>>(
    new Set(SCALES['Major'])
  );

  const progression = parseProgression(progressionInput, selectedRoot, selectedScale);

  function selectKey(note: number) {
    setSelectedRoot(note);
    setActiveChordIdx(null);
    setVisibleDegrees(new Set(SCALES[selectedScale]));
    setUseFlats(FLAT_ROOTS.has(note));
  }

  function selectScale(name: string) {
    setSelectedScale(name);
    setVisibleDegrees(new Set(SCALES[name]));
    setActiveChordIdx(null);
  }

  function selectChord(i: number) {
    const chord = progression[i];
    setActiveChordIdx(i);
    const offset = (chord.root - selectedRoot + 12) % 12;
    setVisibleDegrees(new Set(parseChordIntervals(chord.name).map(n => (n + offset) % 12)));
  }

  function toggleDegree(deg: number) {
    setVisibleDegrees(prev => {
      const next = new Set(prev);
      if (next.has(deg)) next.delete(deg); else next.add(deg);
      return next;
    });
  }

  const STRING_COLORS = ['#e8e9eb', '#dfe0e3', '#d6d8dc', '#cdd0d5', '#c4c8ce', '#bbbfc6'];


  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#ffffff', position: 'relative' }}>
      <style>{`
        .controls button:not(.more-btn) { transition: background 0.15s ease; }
        .controls button:not(.more-btn):hover { background: #1c1c1c !important; }
        .controls input { transition: background 0.15s ease; }
        .controls input:hover { background: #141414 !important; }
        .more-btn { transition: opacity 0.15s ease; }
        .more-btn:hover { opacity: 0.5 !important; }
        .fret-dot { transition: filter 0.12s ease; }
        .fret-dot:hover { filter: brightness(1.35); }
      `}</style>

      {/* ── Instrument toggle ────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#EBEBEB', borderRadius: 20, padding: 3, display: 'flex', gap: 2 }}>
        {(['Bass', 'Guitar'] as const).map(label => {
          const active = (label === 'Guitar') === isGuitar;
          return (
            <button key={label} onClick={() => setIsGuitar(label === 'Guitar')} style={{
              padding: '4px 14px', borderRadius: 16, border: 'none', cursor: 'pointer',
              fontFamily: INTER, fontSize: 13, fontWeight: 400,
              background: active ? '#ffffff' : 'transparent',
              color: active ? '#111111' : '#888888',
              transition: 'background 0.15s ease, color 0.15s ease',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Fretboard ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>

            <rect x={NUT_X} y={MARGIN_TOP - 30} width={BOARD_W} height={BOARD_H + 60} rx={6} fill="#f3f4f6" />

            {MARKERS.map(f => {
              const cx = NUT_X + (f - 0.5) * FRET_W;
              if (DOUBLE_MARKERS.has(f)) {
                return (
                  <g key={f}>
                    <circle cx={cx} cy={stringY(1, strGap) + strGap * 0.35} r={6} fill="#e8e9eb" />
                    <circle cx={cx} cy={stringY(1, strGap) + strGap * 0.65} r={6} fill="#e8e9eb" />
                  </g>
                );
              }
              return <circle key={f} cx={cx} cy={MARGIN_TOP + BOARD_H / 2} r={6} fill="#e8e9eb" />;
            })}

            {Array.from({ length: NUM_FRETS - 1 }, (_, i) => {
              const f = i + 1;
              const x = NUT_X + f * FRET_W;
              return <line key={f} x1={x} y1={MARGIN_TOP - 10} x2={x} y2={MARGIN_TOP + BOARD_H + 10} stroke="#e8e9eb" strokeWidth={1.5} />;
            })}

            {Array.from({ length: numStrings }, (_, s) => (
              <line key={s} x1={MARGIN_LEFT - 50} y1={stringY(s, strGap)} x2={NUT_X + BOARD_W} y2={stringY(s, strGap)} stroke={STRING_COLORS[s] ?? '#cdd0d5'} strokeWidth={1.5} />
            ))}

            {Array.from({ length: NUM_FRETS }, (_, i) => {
              const f = i + 1;
              if (f % 2 !== 0 || f === 12 || f === 24) {
                return (
                  <text key={f} x={NUT_X + (f - 0.5) * FRET_W} y={H - 16} fill="#9CA3AF" fontSize={13} fontFamily="var(--font-inter), system-ui, sans-serif" textAnchor="middle">
                    {f}
                  </text>
                );
              }
              return null;
            })}

            {Array.from({ length: numStrings }, (_, s) =>
              Array.from({ length: NUM_FRETS + 1 }, (_, f) => {
                const note = noteAt(s, f, openStrings, numStrings);
                const cx = fretX(f);
                const cy = stringY(s, strGap);
                const interval = ((note - selectedRoot) % 12 + 12) % 12;
                const colored = visibleDegrees.has(interval);
                const fill = colored ? DEGREE_COLOR[interval] : '#e5e7eb';
                const textFill = colored ? '#000000' : '#9ca3af';
                const label = mode === 'degrees' ? DEGREE_LABEL[interval] : noteNames[note];
                return (
                  <g key={`${s}-${f}`} className="fret-dot" style={{ cursor: 'pointer' }} onClick={() => selectKey(note)}>
                    <circle cx={cx} cy={cy} r={dotR} fill={fill} />
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fontFamily="var(--font-inter), system-ui, sans-serif" fill={textFill} pointerEvents="none">
                      {label}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="controls" style={{ background: '#131110', padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 24, minHeight: 415 }}>

          {/* Title — outside panels */}
          <span style={{ fontFamily: INTER, fontSize: 14, fontWeight: 400, color: '#B1B1B1', letterSpacing: '-0.01em', lineHeight: '18px' }}>
            Explore the bass neck
          </span>

          {/* Panels row */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start'}}>

            {/* Left: view as + show */}
            <div style={{ ...PANEL, flex: '0 0 426px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={LABEL}>View as</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button style={pill(mode === 'notes')} onClick={() => setMode('notes')}>Notes</button>
                  <button style={pill(mode === 'degrees')} onClick={() => setMode('degrees')}>Scale degrees</button>
                  <span style={{ color: '#646464', fontSize: 12, fontFamily: INTER, padding: '0 2px' }}>•</span>
                  <button style={pill(!useFlats)} onClick={() => setUseFlats(false)}>Sharps</button>
                  <button style={pill(useFlats)} onClick={() => setUseFlats(true)}>Flats</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={LABEL}>Show</span>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {SHOW_DEGREES.map(deg => {
                    const on = visibleDegrees.has(deg);
                    return (
                      <button key={deg} onClick={() => toggleDegree(deg)} style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '6px 8px', borderRadius: 4, border: 'none',
                        background: '#040404', cursor: 'pointer',
                        opacity: on ? 1 : 0.4, transition: 'opacity 0.15s',
                      }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: DEGREE_COLOR[deg], flexShrink: 0 }} />
                        <span style={{ fontFamily: INTER, fontSize: 12, color: '#9DA3AF', lineHeight: '16px', whiteSpace: 'nowrap' }}>
                          {DEGREE_DISPLAY[deg]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Middle: key + scale */}
            <div style={{ ...PANEL, flex: '0 0 318px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={LABEL}>Key</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {NATURAL_NOTES.map(i => (
                      <button key={i} style={pill(i === selectedRoot)} onClick={() => selectKey(i)}>
                        {noteNames[i]}
                      </button>
                    ))}
                  </div>
                  {showMore && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {SHARP_NOTES.map(i => (
                        <button key={i} style={pill(i === selectedRoot)} onClick={() => selectKey(i)}>
                          {noteNames[i]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={LABEL}>Scale</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {PRIMARY_SCALES.map(name => (
                      <button key={name} style={pill(name === selectedScale)} onClick={() => selectScale(name)}>
                        {scaleLabel(name)}
                      </button>
                    ))}
                  </div>
                  {showMore && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {MORE_SCALES.map(name => (
                        <button key={name} style={pill(name === selectedScale)} onClick={() => selectScale(name)}>
                          {scaleLabel(name)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button className="more-btn" onClick={() => setShowMore(v => !v)} style={{
                background: 'none', border: 'none',
                fontFamily: INTER, fontSize: 12, color: '#646464',
                cursor: 'pointer', padding: 0, textAlign: 'left' as const,
                textDecoration: 'underline', textDecorationThickness: '1px',
              }}>
                {showMore ? 'Less' : 'More'}
              </button>
            </div>

            {/* Right: progression */}
            <div style={{ ...PANEL, flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={LABEL}>Chords</span>
                <input
                  type="text"
                  placeholder="Write a progression"
                  value={progressionInput}
                  onChange={e => { setProgressionInput(e.target.value); setActiveChordIdx(null); }}
                  style={{
                    background: '#040404', border: 'none', borderRadius: 4,
                    color: '#9DA3AF', fontFamily: INTER,
                    fontSize: 14, letterSpacing: '-0.02em',
                    padding: '4px 8px', outline: 'none', width: '100%',
                    lineHeight: '18px',
                    opacity: progressionInput ? 1 : 0.4,
                  }}
                />
              </div>

              {progression.length > 0 && (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {progression.map((chord, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <button style={pill(i === activeChordIdx)} onClick={() => selectChord(i)}>
                        {chord.name}
                      </button>
                      <span style={{ fontFamily: INTER, fontSize: 14, color: '#6A6A6A', lineHeight: '18px', letterSpacing: '-0.02em' }}>
                        {chordRoman(chord.name, chord.root, selectedRoot, selectedScale)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
      </div>

    </div>
  );
}

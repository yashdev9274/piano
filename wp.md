# Web Piano — Electric Piano Synthesizer

## Project Overview

Build a minimalist electric piano web app (Rhodes/Wurlitzer style) from scratch in a new repository. The app uses **pure Web Audio API FM synthesis** (no audio samples), styled with **shadcn/ui** and **Tailwind CSS**.

**Type:** Electric Piano Synthesizer Web App
**Audio:** Pure Web Audio API (FM Synthesis)
**UI:** Next.js 15 + React 19 + shadcn/ui + Tailwind CSS
**Design:** Minimalist flat design (clean, no glassmorphism)

---

## User Requirements

- **Piano Type:** Electric Piano (Rhodes/Wurlitzer)
- **Audio Source:** Synthesized (Pure Web Audio — no samples)
- **Features:** Full feature parity with Web Harmonium (Volume, Reverb, Transpose, Octave, MIDI)
- **Visual Style:** Minimalist flat design

---

## Part 0: New Repository Setup

### 0.1 Initialize Next.js Project

```bash
npx create-next-app@latest web-piano \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --use-npm \
  --no-turbopack
cd web-piano
```

### 0.2 Install All Dependencies

```bash
# Install shadcn/ui dependencies
npm install @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-slider \
  @radix-ui/react-switch \
  @radix-ui/react-tabs \
  @radix-ui/react-toggle \
  @radix-ui/react-toggle-group \
  @radix-ui/react-tooltip \
  @radix-ui/react-scroll-area \
  class-variance-authority \
  clsx \
  tailwind-merge \
  tailwindcss-animate \
  next-themes \
  react-icons \
  react-resizable-panels

# Install type definitions (if needed)
npm install -D @types/node
```

### 0.3 Initialize shadcn/ui

```bash
npx shadcn@latest init \
  --defaults \
  --style=default \
  --base-color=neutral \
  --css-variables=true \
  --alias="@/*"
```

Accept all defaults. This creates `components.json`, `lib/utils.ts`, and `tailwind.config.ts`.

### 0.4 Add shadcn Components

```bash
npx shadcn@latest add button card dialog slider switch select badge tabs tooltip separator
```

### 0.5 Project Structure

```
web-piano/
├── app/
│   ├── globals.css          # Tailwind imports + minimal piano styles
│   ├── layout.tsx           # Root layout with theme provider + metadata
│   ├── page.tsx             # Main piano page (~400 lines)
│   └── components/          # (kept flat in app dir per shadcn convention)
├── components/
│   ├── ui/                  # shadcn components (Button, Card, Dialog, etc.)
│   ├── piano-keyboard.tsx    # Piano keyboard rendering (~150 lines)
│   ├── control-panel.tsx    # Control panel with all settings (~200 lines)
│   └── theme-provider.tsx    # Dark/light theme management
├── hooks/
│   ├── useAudioEngine.ts     # FM synthesis + voice management (~350 lines)
│   └── useMIDIController.ts  # WebMIDI integration (~100 lines)
├── lib/
│   └── utils.ts             # cn() utility (from shadcn init)
├── public/
│   └── favicon.png          # Piano favicon
├── tailwind.config.ts        # Tailwind config (neutral color palette)
├── tsconfig.json             # TypeScript config (strict mode)
├── next.config.mjs           # Next.js config
├── postcss.config.mjs        # PostCSS config
├── components.json           # shadcn schema
├── package.json              # Dependencies
└── README.md                 # Documentation
```

---

## Part 1: Configuration Files

### 1.1 `tailwind.config.ts`

Minimalist neutral color palette (strip purple/vibrant from harmonium):

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

### 1.2 `app/globals.css`

Strip all harmonium glassmorphism, animations, glows. Keep minimal:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}

/* Piano key pressed state */
.key-pressed-white {
  @apply bg-zinc-200 dark:bg-zinc-700;
}
.key-pressed-black {
  @apply bg-zinc-700 dark:bg-zinc-600;
}

/* Scrollbar minimal */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { @apply bg-transparent; }
::-webkit-scrollbar-thumb { @apply bg-zinc-300 dark:bg-zinc-700 rounded-full; }
```

### 1.3 `app/layout.tsx`

```tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Web Piano — Electric Piano Synthesizer",
  description: "A minimalist electric piano web app with FM synthesis. Rhodes and Wurlitzer sounds in your browser.",
  icons: { icon: "/favicon.png" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 1.4 `components/theme-provider.tsx`

(Standard shadcn theme provider — same as harmonium)

```tsx
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### 1.5 `next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}
export default nextConfig
```

---

## Part 2: Audio Engine — FM Synthesis

### 2.1 Overview

The audio engine uses **2-operator FM synthesis** to create electric piano tones. No audio samples are loaded — all sound is generated programmatically in the browser.

**Rhodes Style:** Warm, bell-like tones with soft attack
**Wurlitzer Style:** Brighter, more metallic with characteristic wobble

### 2.2 FM Synthesis Architecture

```
                    ┌──────────────────────────────────────┐
                    │           VOICE (per note)            │
                    │                                       │
  Modulator OSC ──► GainNode ──► Carrier OSC.frequency     │
  (envelope gain)  (modIndex)                               │
                                                              │
  Carrier OSC ──► Envelope GainNode ──► Tone Filter ──► Output
                    │                                       │
                    └──────────────────────────────────────┘

  Modulation Index Envelope: high → low (attack to sustain)
  Amplitude Envelope:        attack → decay → sustain → release
```

### 2.3 Voice Structure

Each voice consists of:

1. **Modulator OscillatorNode** — produces the FM modulation
2. **Modulator GainNode** — controls modulation depth (index envelope)
3. **Carrier OscillatorNode** — produces the audible frequency
4. **Envelope GainNode** — amplitude ADSR envelope
5. **Tone BiquadFilterNode** — final tone shaping (lowpass)

### 2.4 `hooks/useAudioEngine.ts` — Full Implementation

```typescript
"use client"

import { useRef, useCallback, useState, useEffect } from "react"

// ============================================================================
// TYPES
// ============================================================================

interface Voice {
  carrier: OscillatorNode
  modulator: OscillatorNode
  modulatorGain: GainNode
  envelope: GainNode
  filter: BiquadFilterNode
  isActive: boolean
  note: number
  startTime: number
}

interface SynthesisParams {
  attack: number      // seconds
  decay: number       // seconds
  sustain: number     // 0-1 gain level
  release: number      // seconds
  modIndex: number     // modulation index (carrier_freq * ratio * index)
  modRatio: number    // modulator frequency ratio (1 = same as carrier)
  filterFreq: number  // lowpass cutoff Hz
  filterQ: number     // filter resonance
  detune: number      // cents
}

interface TonePreset {
  name: string
  params: SynthesisParams
}

// ============================================================================
// TONE PRESETS
// ============================================================================

const RHODES_PRESET: TonePreset = {
  name: "Rhodes",
  params: {
    attack:    0.005,  // 5ms — fast attack
    decay:     0.3,    // 300ms — medium decay
    sustain:    0.3,   // 30% sustain level
    release:    0.2,   // 200ms release
    modIndex:   2.0,   // moderate modulation
    modRatio:   2.0,   // modulator at 2x carrier freq
    filterFreq: 4000,  // warm, not too bright
    filterQ:    0.5,
    detune:     3,     // slight warmth
  },
}

const WURLITZER_PRESET: TonePreset = {
  name: "Wurlitzer",
  params: {
    attack:    0.003,  // 3ms — very fast
    decay:     0.15,   // 150ms — quick decay
    sustain:    0.2,   // 20% sustain
    release:    0.15,  // 150ms
    modIndex:   3.0,   // higher modulation = brighter
    modRatio:   3.5,   // metallic ratio
    filterFreq: 3000,  // slightly darker
    filterQ:    1.0,   // more resonance
    detune:     5,
  },
}

// ============================================================================
// NOTE FREQUENCY CALCULATION
// ============================================================================

// MIDI note 69 = A4 = 440Hz
function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12)
}

// ============================================================================
// SYNTHESIS ENGINE
// ============================================================================

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const reverbNodeRef = useRef<ConvolverNode | null>(null)
  const voicesRef = useRef<Voice[]>([])
  const MAX_VOICES = 16

  const [isInitialized, setIsInitialized] = useState(false)
  const [volume, setVolume] = useState(70)
  const [useReverb, setUseReverb] = useState(false)
  const [transpose, setTranspose] = useState(0)
  const [octaveShift, setOctaveShift] = useState(0)
  const [activeTone, setActiveTone] = useState<"rhodes" | "wurlitzer">("rhodes")

  // ==========================================================================
  // AUDIO CONTEXT INITIALIZATION
  // ==========================================================================

  const initializeAudio = useCallback(async () => {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    audioContextRef.current = ctx

    // Master gain node
    const masterGain = ctx.createGain()
    masterGain.gain.value = 0.7
    masterGain.connect(ctx.destination)
    masterGainRef.current = masterGain

    // Reverb convolver node
    const reverb = ctx.createConvolver()
    reverb.buffer = generateReverbImpulse(ctx, 1.5, 0.8)
    reverb.connect(ctx.destination)
    reverbNodeRef.current = reverb

    // Initialize voice pool
    voicesRef.current = []
    for (let i = 0; i < MAX_VOICES; i++) {
      voicesRef.current.push({} as Voice)
    }

    setIsInitialized(true)
  }, [])

  // ==========================================================================
  // REVERB IMPULSE GENERATION (no external file needed)
  // ==========================================================================

  function generateReverbImpulse(
    ctx: AudioContext,
    duration: number,
    decay: number
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const impulse = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
      }
    }
    return impulse
  }

  // ==========================================================================
  // VOICE ALLOCATION (steal oldest if pool is full)
  // ==========================================================================

  function allocateVoice(): Voice | null {
    const voices = voicesRef.current
    const now = audioContextRef.current?.currentTime ?? 0

    // Find a free voice
    let free = voices.find(v => !v.isActive)
    if (free) return free

    // Steal the oldest active voice
    let oldest = voices[0]
    for (const v of voices) {
      if (v.startTime < oldest.startTime) oldest = v
    }
    stopVoice(oldest)
    return oldest
  }

  // ==========================================================================
  // VOICE START
  // ==========================================================================

  function startVoice(midiNote: number, velocity: number = 1) {
    const ctx = audioContextRef.current
    const master = masterGainRef.current
    if (!ctx || !master) return

    const voice = allocateVoice()
    if (!voice) return

    const preset = activeTone === "rhodes" ? RHODES_PRESET : WURLITZER_PRESET
    const p = preset.params

    const freq = midiToFreq(midiNote)
    const now = ctx.currentTime
    const velGain = 0.3 + (velocity / 127) * 0.7 // velocity 0-127 → gain 0.3-1.0

    // Create modulator oscillator
    const modulator = ctx.createOscillator()
    modulator.type = "sine"
    modulator.frequency.value = freq * p.modRatio

    // Create modulator gain (controls modulation index)
    const modGain = ctx.createGain()
    modGain.gain.value = 0 // start at 0, ramp up

    // Create carrier oscillator
    const carrier = ctx.createOscillator()
    carrier.type = "sine"
    carrier.frequency.value = freq
    carrier.detune.value = p.detune

    // Connect: modulator → modGain → carrier.frequency
    modulator.connect(modGain)
    modGain.connect(carrier.frequency)

    // Create amplitude envelope gain node
    const envelope = ctx.createGain()
    envelope.gain.value = 0

    // Create tone filter
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = p.filterFreq
    filter.Q.value = p.filterQ

    // Connect: carrier → envelope → filter → master
    carrier.connect(envelope)
    envelope.connect(filter)
    filter.connect(master)

    // Start oscillators
    modulator.start(now)
    carrier.start(now)

    // Modulation index envelope: ramp up then decay to sustain*initial
    const peakMod = freq * p.modRatio * p.modIndex
    modGain.gain.setValueAtTime(0, now)
    modGain.gain.linearRampToValueAtTime(peakMod, now + p.attack)
    modGain.gain.exponentialRampToValueAtTime(peakMod * p.sustain + 0.001, now + p.attack + p.decay)

    // Amplitude envelope: ADSR
    envelope.gain.setValueAtTime(0, now)
    envelope.gain.linearRampToValueAtTime(velGain, now + p.attack)
    envelope.gain.exponentialRampToValueAtTime(velGain * p.sustain + 0.001, now + p.attack + p.decay)

    // Store voice state
    voice.carrier = carrier
    voice.modulator = modulator
    voice.modulatorGain = modGain
    voice.envelope = envelope
    voice.filter = filter
    voice.isActive = true
    voice.note = midiNote
    voice.startTime = now
  }

  // ==========================================================================
  // VOICE STOP (trigger release phase)
  // ==========================================================================

  function stopVoice(voice: Voice) {
    const ctx = audioContextRef.current
    if (!ctx) return

    const preset = activeTone === "rhodes" ? RHODES_PRESET : WURLITZER_PRESET
    const p = preset.params
    const now = ctx.currentTime

    // Release envelope
    const releaseStart = voice.envelope.gain.value
    voice.envelope.gain.cancelScheduledValues(now)
    voice.envelope.gain.setValueAtTime(releaseStart, now)
    voice.envelope.gain.exponentialRampToValueAtTime(0.001, now + p.release)

    // Release modulation
    voice.modulatorGain.gain.cancelScheduledValues(now)
    voice.modulatorGain.gain.setValueAtTime(voice.modulatorGain.gain.value, now)
    voice.modulatorGain.gain.exponentialRampToValueAtTime(0.001, now + p.release)

    // Schedule stop and cleanup
    const stopTime = now + p.release + 0.05
    voice.carrier.stop(stopTime)
    voice.modulator.stop(stopTime)
    voice.isActive = false

    setTimeout(() => {
      try { voice.carrier.disconnect() } catch {}
      try { voice.modulator.disconnect() } catch {}
      try { voice.modulatorGain.disconnect() } catch {}
      try { voice.envelope.disconnect() } catch {}
      try { voice.filter.disconnect() } catch {}
    }, (p.release + 0.1) * 1000)
  }

  // ==========================================================================
  // NOTE ON / OFF API (called by keyboard and MIDI)
  // ==========================================================================

  const noteOn = useCallback((midiNote: number, velocity: number = 1) => {
    if (!audioContextRef.current) return
    // Resume context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume()
    }
    // Apply transpose and octave shift
    const adjustedNote = midiNote + transpose + (octaveShift * 12)
    startVoice(adjustedNote, velocity)
  }, [transpose, octaveShift])

  const noteOff = useCallback((midiNote: number) => {
    if (!audioContextRef.current) return
    const adjustedNote = midiNote + transpose + (octaveShift * 12)
    const voice = voicesRef.current.find(v => v.isActive && v.note === adjustedNote)
    if (voice) stopVoice(voice)
  }, [transpose, octaveShift])

  // ==========================================================================
  // STOP ALL VOICES (on blur / parameter change)
  // ==========================================================================

  const stopAllVoices = useCallback(() => {
    for (const voice of voicesRef.current) {
      if (voice.isActive) stopVoice(voice)
    }
  }, [])

  // ==========================================================================
  // VOLUME CONTROL
  // ==========================================================================

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume / 100
    }
  }, [volume])

  // ==========================================================================
  // REVERB ROUTING
  // ==========================================================================

  useEffect(() => {
    if (!masterGainRef.current || !reverbNodeRef.current) return
    if (useReverb) {
      masterGainRef.current.connect(reverbNodeRef.current)
    } else {
      try { masterGainRef.current.disconnect(reverbNodeRef.current) } catch {}
    }
  }, [useReverb])

  // ==========================================================================
  // STOP ALL ON CONTEXT RESUME (e.g., tab regains focus)
  // ==========================================================================

  useEffect(() => {
    const onFocus = () => stopAllVoices()
    window.addEventListener("blur", onFocus)
    return () => window.removeEventListener("blur", onFocus)
  }, [stopAllVoices])

  return {
    isInitialized,
    initializeAudio,
    noteOn,
    noteOff,
    stopAllVoices,
    volume, setVolume,
    useReverb, setUseReverb,
    transpose, setTranspose,
    octaveShift, setOctaveShift,
    activeTone, setActiveTone,
  }
}
```

### 2.5 Key Synthesis Decisions

| Decision | Value | Reason |
|---|---|---|
| Oscillator type | `sine` | Cleanest FM — avoids harsh harmonics |
| Modulator ratio (Rhodes) | `2.0` | Classic bell tone, warm overtones |
| Modulator ratio (Wurlitzer) | `3.5` | Metallic, tine-like character |
| Modulation index envelope | Peak at attack, decay to sustain | Bell-like: bright start, warm sustain |
| Amplitude envelope | ADSR with fast attack | Responsive key feel |
| Voice pool size | 16 | Good polyphony, manageable CPU |
| Velocity mapping | `0.3 + (vel/127)*0.7` | Minimum 30% so quiet notes still audible |
| Reverb | Generated impulse, no file | No external dependencies |

---

## Part 3: Piano Keyboard Component

### 3.1 `components/piano-keyboard.tsx`

```typescript
"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// KEYBOARD MAPPING
// Top row: 1-0   → 10 white keys (C4 through E5)
// QWERTY row: Q-P → 10 white keys (F4 through A5)
// Total: 20 keys across 2 rows, all white keys (no black keys)
// ============================================================================

interface PianoKey {
  computerKey: string
  midiNote: number
  noteName: string
  sargam: string
  row: "top" | "bottom"
}

const PIANO_KEYS: PianoKey[] = [
  // Top row (1-0) — C4 to E5
  { computerKey: "1", midiNote: 60, noteName: "C4",  sargam: "Sa",  row: "top" },
  { computerKey: "2", midiNote: 62, noteName: "D4",  sargam: "Re",  row: "top" },
  { computerKey: "3", midiNote: 64, noteName: "E4",  sargam: "Ga",  row: "top" },
  { computerKey: "4", midiNote: 65, noteName: "F4",  sargam: "Ma",  row: "top" },
  { computerKey: "5", midiNote: 67, noteName: "G4",  sargam: "Pa",  row: "top" },
  { computerKey: "6", midiNote: 69, noteName: "A4",  sargam: "Dha", row: "top" },
  { computerKey: "7", midiNote: 71, noteName: "B4",  sargam: "Ni",  row: "top" },
  { computerKey: "8", midiNote: 72, noteName: "C5",  sargam: "Sa",  row: "top" },
  { computerKey: "9", midiNote: 74, noteName: "D5",  sargam: "Re",  row: "top" },
  { computerKey: "0", midiNote: 76, noteName: "E5",  sargam: "Ga",  row: "top" },
  // QWERTY row (Q-P) — F4 to A5
  { computerKey: "q", midiNote: 65, noteName: "F4",  sargam: "Ma",  row: "bottom" },
  { computerKey: "w", midiNote: 67, noteName: "G4",  sargam: "Pa",  row: "bottom" },
  { computerKey: "e", midiNote: 69, noteName: "A4",  sargam: "Dha", row: "bottom" },
  { computerKey: "r", midiNote: 71, noteName: "B4",  sargam: "Ni",  row: "bottom" },
  { computerKey: "t", midiNote: 72, noteName: "C5",  sargam: "Sa",  row: "bottom" },
  { computerKey: "y", midiNote: 74, noteName: "D5",  sargam: "Re",  row: "bottom" },
  { computerKey: "u", midiNote: 76, noteName: "E5",  sargam: "Ga",  row: "bottom" },
  { computerKey: "i", midiNote: 77, noteName: "F5",  sargam: "Ma",  row: "bottom" },
  { computerKey: "o", midiNote: 79, noteName: "G5",  sargam: "Pa",  row: "bottom" },
  { computerKey: "p", midiNote: 81, noteName: "A5",  sargam: "Dha", row: "bottom" },
]

// Build fast lookup: computer key → PianoKey
const KEY_LOOKUP: { [key: string]: PianoKey } = {}
PIANO_KEYS.forEach(key => { KEY_LOOKUP[key.computerKey] = key })

interface PianoKeyboardProps {
  noteOn: (midiNote: number, velocity?: number) => void
  noteOff: (midiNote: number) => void
  activeNotes?: Set<number>
}

export function PianoKeyboard({ noteOn, noteOff, activeNotes = new Set() }: PianoKeyboardProps) {

  const handlePointerDown = useCallback((key: PianoKey) => {
    noteOn(key.midiNote, 100)
  }, [noteOn])

  const handlePointerUp = useCallback((key: PianoKey) => {
    noteOff(key.midiNote)
  }, [noteOff])

  const topRowKeys = PIANO_KEYS.filter(k => k.row === "top")
  const bottomRowKeys = PIANO_KEYS.filter(k => k.row === "bottom")

  return (
    <div className="w-full max-w-4xl mx-auto px-2">
      <div className="border border-border rounded-xl bg-zinc-100 dark:bg-zinc-900 p-4 shadow-sm">
        {/* Top row */}
        <div className="flex justify-center mb-2">
          <div className="flex gap-1">
            {topRowKeys.map((key) => {
              const isActive = activeNotes.has(key.midiNote)
              return (
                <button
                  key={key.computerKey}
                  onMouseDown={() => handlePointerDown(key)}
                  onMouseUp={() => handlePointerUp(key)}
                  onMouseLeave={() => handlePointerUp(key)}
                  onTouchStart={(e) => { e.preventDefault(); handlePointerDown(key) }}
                  onTouchEnd={(e) => { e.preventDefault(); handlePointerUp(key) }}
                  className={cn(
                    "relative flex flex-col items-center justify-end pb-2 rounded-md border border-zinc-300 dark:border-zinc-700",
                    "w-10 h-24 sm:w-12 sm:h-28 cursor-pointer select-none transition-all duration-75",
                    "bg-white dark:bg-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-200",
                    "active:translate-y-0.5 active:scale-95",
                    isActive && "key-pressed-white",
                  )}
                >
                  {/* Computer key shortcut */}
                  <div className="absolute top-1 text-xs font-mono font-bold px-1 rounded bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800">
                    {key.computerKey.toUpperCase()}
                  </div>
                  {/* Note name */}
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-600">
                    {key.noteName}
                  </div>
                  {/* Sargam */}
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-800">
                    {key.sargam}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        {/* Bottom row */}
        <div className="flex justify-center">
          <div className="flex gap-1">
            {bottomRowKeys.map((key) => {
              const isActive = activeNotes.has(key.midiNote)
              return (
                <button
                  key={key.computerKey}
                  onMouseDown={() => handlePointerDown(key)}
                  onMouseUp={() => handlePointerUp(key)}
                  onMouseLeave={() => handlePointerUp(key)}
                  onTouchStart={(e) => { e.preventDefault(); handlePointerDown(key) }}
                  onTouchEnd={(e) => { e.preventDefault(); handlePointerUp(key) }}
                  className={cn(
                    "relative flex flex-col items-center justify-end pb-2 rounded-md border border-zinc-300 dark:border-zinc-700",
                    "w-10 h-24 sm:w-12 sm:h-28 cursor-pointer select-none transition-all duration-75",
                    "bg-white dark:bg-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-200",
                    "active:translate-y-0.5 active:scale-95",
                    isActive && "key-pressed-white",
                  )}
                >
                  {/* Computer key shortcut */}
                  <div className="absolute top-1 text-xs font-mono font-bold px-1 rounded bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800">
                    {key.computerKey.toUpperCase()}
                  </div>
                  {/* Note name */}
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-600">
                    {key.noteName}
                  </div>
                  {/* Sargam */}
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-800">
                    {key.sargam}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export { PIANO_KEYS, KEY_LOOKUP }
```

### 3.2 Key Rendering Layout

```
Top row (1-0):     [1][2][3][4][5][6][7][8][9][0]
                    C D E F G A B C D E
                   SaReGaMaPaDhaNiSaReGa

QWERTY row (Q-P):  [Q][W][E][R][T][Y][U][I][O][P]
                    F G A B C D E F G A
                   MaPaDhaNiSaReGaMaPaDha
```

### 3.3 Note Overlap

Note C4 (midi 60) appears twice — once in top row (`1`) and once in the overlap region. This is intentional for range coverage. The audio engine handles both as separate triggers for the same note.

---

## Part 4: Control Panel Component

### 4.1 `components/control-panel.tsx`

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ControlPanelProps {
  volume: number
  onVolumeChange: (v: number) => void
  useReverb: boolean
  onReverbChange: (v: boolean) => void
  transpose: number
  onTransposeChange: (v: number) => void
  octaveShift: number
  onOctaveShiftChange: (v: number) => void
  activeTone: "rhodes" | "wurlitzer"
  onToneChange: (t: "rhodes" | "wurlitzer") => void
  midiSupported: boolean
  midiDevices: { id: string; name: string }[]
  selectedMidiDevice: string
  onMidiDeviceChange: (id: string) => void
}

export function ControlPanel({
  volume, onVolumeChange,
  useReverb, onReverbChange,
  transpose, onTransposeChange,
  octaveShift, onOctaveShiftChange,
  activeTone, onToneChange,
  midiSupported, midiDevices, selectedMidiDevice, onMidiDeviceChange,
}: ControlPanelProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-2 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-center text-2xl font-bold">{volume}%</div>
            <Slider value={[volume]} onValueChange={([v]) => onVolumeChange(v)} max={100} min={0} step={1} />
          </CardContent>
        </Card>

        {/* Reverb */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reverb</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-center text-lg font-bold">{useReverb ? "ON" : "OFF"}</div>
            <div className="flex items-center justify-center">
              <Switch checked={useReverb} onCheckedChange={onReverbChange} />
            </div>
          </CardContent>
        </Card>

        {/* Tone */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tone</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTone} onValueChange={(v) => onToneChange(v as "rhodes" | "wurlitzer")}>
              <TabsList className="w-full h-8">
                <TabsTrigger value="rhodes" className="text-xs">Rhodes</TabsTrigger>
                <TabsTrigger value="wurlitzer" className="text-xs">Wurlitzer</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Transpose */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transpose</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-center text-lg font-bold">
              {transpose > 0 ? `+${transpose}` : transpose}
            </div>
            <Select value={String(transpose)} onValueChange={(v) => onTransposeChange(Number(v))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 23 }, (_, i) => i - 11).map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {n > 0 ? `+${n}` : n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Octave */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Octave</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-center text-lg font-bold">
              {octaveShift > 0 ? `+${octaveShift}` : octaveShift}
            </div>
            <Select value={String(octaveShift)} onValueChange={(v) => onOctaveShiftChange(Number(v))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[-2, -1, 0, 1, 2].map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {n > 0 ? `+${n}` : n === 0 ? "0" : n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* MIDI */}
        <Card className="col-span-2 sm:col-span-3 lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              MIDI
              <Badge variant={midiSupported ? "secondary" : "destructive"} className="text-xs">
                {midiSupported ? "Connected" : "Not Supported"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {midiDevices.length > 0 ? (
              <Select value={selectedMidiDevice} onValueChange={onMidiDeviceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select MIDI device" />
                </SelectTrigger>
                <SelectContent>
                  {midiDevices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                No MIDI devices detected. Connect a MIDI keyboard and refresh.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## Part 5: MIDI Controller Hook

### 5.1 `hooks/useMIDIController.ts`

```typescript
"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface MIDIDevice {
  id: string
  name: string
  manufacturer?: string
}

interface UseMIDIControllerOptions {
  onNoteOn: (note: number, velocity: number) => void
  onNoteOff: (note: number) => void
  selectedDeviceId?: string
}

export function useMIDIController({
  onNoteOn,
  onNoteOff,
  selectedDeviceId,
}: UseMIDIControllerOptions) {
  const [midiSupported, setMidiSupported] = useState(false)
  const [devices, setDevices] = useState<MIDIDevice[]>([])
  const activeNotesRef = useRef<Set<number>>(new Set())

  const initializeMIDI = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      setMidiSupported(false)
      return
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false })
      setMidiSupported(true)

      const foundDevices: MIDIDevice[] = []
      for (const input of access.inputs.values()) {
        foundDevices.push({
          id: input.id,
          name: input.name ?? "Unknown Device",
          manufacturer: input.manufacturer ?? undefined,
        })

        // Set up message handler
        input.onmidimessage = (event: MIDIMessageEvent) => {
          const [command, note, velocity = 0] = event.data as Uint8Array
          const deviceMatch = !selectedDeviceId || input.id === selectedDeviceId
          if (!deviceMatch) return

          // Note On (command 144-159) with velocity > 0
          if (command >= 144 && command <= 159 && velocity > 0) {
            activeNotesRef.current.add(note)
            onNoteOn(note, velocity)
          }
          // Note Off (command 128-143) or Note On with velocity 0
          else if (
            (command >= 128 && command <= 143) ||
            (command >= 144 && command <= 159 && velocity === 0)
          ) {
            activeNotesRef.current.delete(note)
            onNoteOff(note)
          }
          // Sustain pedal (CC 64)
          else if (command === 176 && note === 64) {
            if (velocity < 64) {
              // Sustain off — release all held notes
              for (const n of activeNotesRef.current) {
                onNoteOff(n)
              }
              activeNotesRef.current.clear()
            }
            // Sustain on — notes stay held until pedal released
          }
        }
      }
      setDevices(foundDevices)
    } catch {
      setMidiSupported(false)
    }
  }, [onNoteOn, onNoteOff, selectedDeviceId])

  useEffect(() => {
    initializeMIDI()
  }, [initializeMIDI])

  return { midiSupported, devices }
}
```

---

## Part 6: Main Page — Integration

### 6.1 `app/page.tsx`

```typescript
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { PianoKeyboard } from "@/components/piano-keyboard"
import { ControlPanel } from "@/components/control-panel"
import { useAudioEngine } from "@/hooks/useAudioEngine"
import { useMIDIController } from "@/hooks/useMIDIController"
import { KEY_LOOKUP, PIANO_KEYS } from "@/components/piano-keyboard"

// ============================================================================
// EXTENDED AUDIO CONTEXT TYPE
// ============================================================================

interface AudioContextType extends AudioContext {
  createGain(): GainNode
  createBufferSource(): AudioBufferSourceNode
  createConvolver(): ConvolverNode
  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer>
}

// ============================================================================
// GLOBAL COMPUTER KEYBOARD → MIDI NOTE MAP
// ============================================================================

const COMPUTER_KEY_MAP: { [key: string]: number } = {}
PIANO_KEYS.forEach(key => { COMPUTER_KEY_MAP[key.computerKey] = key.midiNote })

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function WebPiano() {
  const { theme, setTheme } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set())
  const [selectedMidiDevice, setSelectedMidiDevice] = useState("")
  const activeKeysRef = useRef<Set<string>>(new Set())

  // Audio engine
  const {
    isInitialized,
    initializeAudio,
    noteOn,
    noteOff,
    stopAllVoices,
    volume, setVolume,
    useReverb, setUseReverb,
    transpose, setTranspose,
    octaveShift, setOctaveShift,
    activeTone, setActiveTone,
  } = useAudioEngine()

  // MIDI controller
  const { midiSupported, devices } = useMIDIController({
    onNoteOn: (note, velocity) => {
      noteOn(note, velocity)
      setActiveNotes(prev => new Set([...prev, note]))
    },
    onNoteOff: (note) => {
      noteOff(note)
      setActiveNotes(prev => {
        const next = new Set(prev)
        next.delete(note)
        return next
      })
    },
    selectedDeviceId: selectedMidiDevice,
  })

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio()
    setTimeout(() => setIsLoaded(true), 2000)
  }, [initializeAudio])

  // ==========================================================================
  // COMPUTER KEYBOARD HANDLERS
  // ==========================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.repeat || !isLoaded) return
    const key = event.key.toLowerCase()
    const ctrlKey = event.ctrlKey
    const altKey = event.altKey

    // Control shortcuts
    if (altKey && !ctrlKey) {
      event.preventDefault()
      if (event.key === "ArrowUp")   setVolume(v => Math.min(100, v + 5))
      if (event.key === "ArrowDown") setVolume(v => Math.max(0, v - 5))
      return
    }

    if (ctrlKey && altKey) {
      event.preventDefault()
      if (event.key === "ArrowUp")   setOctaveShift(v => Math.min(2, v + 1))
      if (event.key === "ArrowDown") setOctaveShift(v => Math.max(-2, v - 1))
      if (event.key === "ArrowRight") setTranspose(v => Math.min(11, v + 1))
      if (event.key === "ArrowLeft")  setTranspose(v => Math.max(-11, v - 1))
      if (event.key.toLowerCase() === "r") setUseReverb(v => !v)
      return
    }

    // Musical keys
    if (COMPUTER_KEY_MAP[key] !== undefined && !activeKeysRef.current.has(key)) {
      event.preventDefault()
      const midiNote = COMPUTER_KEY_MAP[key]
      activeKeysRef.current.add(key)
      noteOn(midiNote, 100)
      setActiveNotes(prev => new Set([...prev, midiNote]))
    }
  }, [isLoaded, noteOn, setVolume, setOctaveShift, setTranspose, setUseReverb])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!isLoaded) return
    const key = event.key.toLowerCase()

    if (COMPUTER_KEY_MAP[key] !== undefined && activeKeysRef.current.has(key)) {
      activeKeysRef.current.delete(key)
      const midiNote = COMPUTER_KEY_MAP[key]
      noteOff(midiNote)
      setActiveNotes(prev => {
        const next = new Set(prev)
        next.delete(midiNote)
        return next
      })
    }
  }, [isLoaded, noteOff])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // ==========================================================================
  // LOADING SCREEN
  // ==========================================================================

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold">Loading...</div>
          <div className="text-muted-foreground">Initializing audio engine</div>
        </div>
      </div>
    )
  }

  // ==========================================================================
  // MAIN UI
  // ==========================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 py-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Web Piano</h1>
            <p className="text-sm text-muted-foreground">Electric Piano Synthesizer</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {activeTone === "rhodes" ? "Rhodes" : "Wurlitzer"}
            </Badge>
            <Badge variant="outline">
              Oct {octaveShift > 0 ? `+${octaveShift}` : octaveShift}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? "Dark" : "Light"}
            </Button>
          </div>
        </header>

        {/* Piano Keyboard */}
        <div className="mb-6">
          <PianoKeyboard
            noteOn={(note, vel) => { noteOn(note, vel); setActiveNotes(prev => new Set([...prev, note])) }}
            noteOff={(note) => { noteOff(note); setActiveNotes(prev => { const n = new Set(prev); n.delete(note); return n }) }}
            activeNotes={activeNotes}
          />
        </div>

        {/* Control Panel */}
        <ControlPanel
          volume={volume} onVolumeChange={setVolume}
          useReverb={useReverb} onReverbChange={setUseReverb}
          transpose={transpose} onTransposeChange={setTranspose}
          octaveShift={octaveShift} onOctaveShiftChange={setOctaveShift}
          activeTone={activeTone} onToneChange={setActiveTone}
          midiSupported={midiSupported}
          midiDevices={devices}
          selectedMidiDevice={selectedMidiDevice}
          onMidiDeviceChange={setSelectedMidiDevice}
        />

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Use <code className="px-1 py-0.5 bg-muted rounded text-xs">1-0</code> and <code className="px-1 py-0.5 bg-muted rounded text-xs">Q-P</code> to play</p>
          <p className="mt-1">
            <code className="px-1 py-0.5 bg-muted rounded text-xs">Alt+Arrow</code> Volume &nbsp;
            <code className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Alt+Arrow</code> Octave/Transpose &nbsp;
            <code className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Alt+R</code> Reverb
          </p>
        </footer>
      </div>
    </div>
  )
}
```

---

## Part 7: Keyboard Shortcuts Reference

| Action | Shortcut |
|---|---|
| Play notes | `1` `2` `3` `4` `5` `6` `7` `8` `9` `0` (top row) |
| Play notes | `Q` `W` `E` `R` `T` `Y` `U` `I` `O` `P` (QWERTY row) |
| Volume Up | `Alt + ArrowUp` |
| Volume Down | `Alt + ArrowDown` |
| Octave Up | `Ctrl + Alt + ArrowUp` |
| Octave Down | `Ctrl + Alt + ArrowDown` |
| Transpose Up | `Ctrl + Alt + ArrowRight` |
| Transpose Down | `Ctrl + Alt + ArrowLeft` |
| Toggle Reverb | `Ctrl + Alt + R` |

---

## Part 8: File Manifest

### 8.1 Complete File List for New Repo

| File | Lines | Purpose |
|---|---|---|
| `package.json` | ~40 | Project metadata + dependencies |
| `tsconfig.json` | ~20 | TypeScript strict config |
| `next.config.mjs` | ~15 | Next.js config (eslint/typescript ignore) |
| `tailwind.config.ts` | ~40 | Tailwind with neutral palette |
| `postcss.config.mjs` | ~8 | PostCSS with tailwindcss |
| `components.json` | ~20 | shadcn schema config |
| `lib/utils.ts` | ~5 | cn() utility |
| `app/globals.css` | ~60 | Tailwind + minimal piano styles |
| `app/layout.tsx` | ~35 | Root layout + metadata + theme provider |
| `app/page.tsx` | ~200 | Main page: state, keyboard events, MIDI, layout |
| `components/theme-provider.tsx` | ~7 | Dark/light theme wrapper |
| `components/ui/button.tsx` | ~55 | shadcn Button |
| `components/ui/card.tsx` | ~80 | shadcn Card |
| `components/ui/dialog.tsx` | ~120 | shadcn Dialog |
| `components/ui/slider.tsx` | ~28 | shadcn Slider |
| `components/ui/switch.tsx` | ~29 | shadcn Switch |
| `components/ui/select.tsx` | ~160 | shadcn Select |
| `components/ui/badge.tsx` | ~30 | shadcn Badge |
| `components/ui/tabs.tsx` | ~50 | shadcn Tabs |
| `components/ui/tooltip.tsx` | ~50 | shadcn Tooltip |
| `components/ui/separator.tsx` | ~30 | shadcn Separator |
| `hooks/useAudioEngine.ts` | ~350 | FM synthesis + voice management |
| `hooks/useMIDIController.ts` | ~100 | WebMIDI integration |
| `components/piano-keyboard.tsx` | ~150 | Piano keyboard UI + key mapping |
| `components/control-panel.tsx` | ~200 | Control panel with all settings |
| `README.md` | ~150 | Documentation |

### 8.2 Files to Delete from Harmonium (Not Needed)

- `public/harmonium-kannan-orig.wav` — sample-based, not used in piano
- `public/reverb.wav` — reverb is generated programmatically

---

## Part 9: Implementation Order

### Phase 1: Scaffold (Do First)
1. Run `npx create-next-app@latest web-piano ...` (Part 0.1)
2. Install all dependencies (Part 0.2)
3. Initialize shadcn and add all components (Parts 0.3–0.4)
4. Set up all config files: `tailwind.config.ts`, `globals.css`, `layout.tsx`, `next.config.mjs`, `components.json`, `utils.ts` (Parts 1.1–1.5)
5. Add `theme-provider.tsx` component
6. Add all shadcn UI components (`button`, `card`, `dialog`, `slider`, `switch`, `select`, `badge`, `tabs`, `tooltip`, `separator`)

### Phase 2: Audio Engine (Core)
7. Build `useAudioEngine.ts` hook — FM synthesis, voice pool, reverb, controls (Part 2)
8. Test audio manually: trigger `noteOn`/`noteOff` from console, verify sound

### Phase 3: MIDI
9. Build `useMIDIController.ts` hook (Part 5)
10. Test with MIDI device if available

### Phase 4: UI Components
11. Build `piano-keyboard.tsx` — 20 keys, 2 rows, click/touch/keyboard mapping (Part 3)
12. Build `control-panel.tsx` — Volume, Reverb, Tone, Transpose, Octave, MIDI (Part 4)

### Phase 5: Integration
13. Build `app/page.tsx` — wire everything together (Part 6)
14. Add keyboard event listeners
15. Add loading screen

### Phase 6: Polish
16. Responsive layout (mobile breakpoints)
17. Dark/light mode (theme already wired)
18. Add favicon to `public/`
19. Write `README.md`
20. Test in Chrome, Firefox, Safari

---

## Part 10: Technical Reference from Harmonium

These specific patterns from the harmonium should be replicated in the piano:

### AudioContext Extended Type
```typescript
interface AudioContextType extends AudioContext {
  createGain(): GainNode
  createBufferSource(): AudioBufferSourceNode
  createConvolver(): ConvolverNode
  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer>
}
```

### Resume Context on User Interaction
```typescript
// Browser autoplay policy — must resume on first interaction
if (audioContextRef.current?.state === "suspended") {
  audioContextRef.current.resume()
}
```

### Stop All Voices on Tab Blur
```typescript
useEffect(() => {
  const onBlur = () => stopAllVoices()
  window.addEventListener("blur", onBlur)
  return () => window.removeEventListener("blur", onBlur)
}, [stopAllVoices])
```

### Key Down/Up with Event Repeat Guard
```typescript
// event.repeat prevents key-hold auto-repeat from double-triggering
if (event.repeat) return
```

### Note Off via Mouse Leave
```typescript
onMouseLeave={() => handlePointerUp(key)}
// Prevents stuck notes when mouse leaves a key
```

### Touch Event Prevention
```typescript
onTouchStart={(e) => { e.preventDefault(); handlePointerDown(key) }}
onTouchEnd={(e) => { e.preventDefault(); handlePointerUp(key) }}
// preventDefault stops scroll/zoom on mobile piano
```

### Voice Stealing
```typescript
// When all voices are busy, steal the oldest
let oldest = voices[0]
for (const v of voices) {
  if (v.startTime < oldest.startTime) oldest = v
}
stopVoice(oldest)
```

### Reverb via ConvolverNode
```typescript
// Connect/disconnect reverb from master gain dynamically
masterGain.connect(reverbNode)  // ON
masterGain.disconnect(reverbNode) // OFF
```

### ADSR Envelope Scheduling
```typescript
// Use AudioContext.currentTime for sample-accurate scheduling
const now = ctx.currentTime
envelope.gain.setValueAtTime(0, now)
envelope.gain.linearRampToValueAtTime(peak, now + attack)
envelope.gain.exponentialRampToValueAtTime(sustain * peak, now + attack + decay)
```

---

## Part 11: Dependency Versions (Exact)

Use these versions for maximum compatibility:

```json
{
  "next": "15.2.8",
  "react": "^19",
  "react-dom": "^19",
  "typescript": "^5",
  "tailwindcss": "^3.4.17",
  "@radix-ui/react-dialog": "1.1.4",
  "@radix-ui/react-dropdown-menu": "2.1.4",
  "@radix-ui/react-select": "2.1.4",
  "@radix-ui/react-slider": "1.2.2",
  "@radix-ui/react-switch": "1.1.2",
  "@radix-ui/react-tabs": "1.1.2",
  "@radix-ui/react-toggle": "1.1.1",
  "@radix-ui/react-toggle-group": "1.1.1",
  "@radix-ui/react-tooltip": "1.1.6",
  "@radix-ui/react-scroll-area": "1.2.2",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.5",
  "tailwindcss-animate": "^1.0.7",
  "next-themes": "latest",
  "react-icons": "^5.5.0",
  "react-resizable-panels": "^2.1.7",
  "@hookform/resolvers": "^3.9.1",
  "react-hook-form": "^7.54.1",
  "@types/node": "^22"
}
```

---

## Part 12: Browser Compatibility

| Browser | Minimum Version | Notes |
|---|---|---|
| Chrome | 66+ | Full support |
| Firefox | 60+ | Full support |
| Safari | 14.1+ | Full support (uses webkit prefix fallback) |
| Edge | 79+ | Full support |
| Mobile Chrome | Latest | Touch events + AudioContext |
| Mobile Safari | 14.5+ | Touch events, autoplay restrictions apply |

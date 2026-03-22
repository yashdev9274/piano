"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"

import { ControlPanel } from "@/components/control-panel"
import { PIANO_KEYS, PianoKeyboard } from "@/components/piano-keyboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAudioEngine } from "@/hooks/useAudioEngine"
import { useMIDIController } from "@/hooks/useMIDIController"

const COMPUTER_KEY_MAP = Object.fromEntries(
  PIANO_KEYS.map((key) => [key.computerKey, key.midiNote]),
) as Record<string, number>

export default function WebPiano() {
  const { resolvedTheme, setTheme } = useTheme()
  const [ready, setReady] = useState(false)
  const [selectedMidiDevice, setSelectedMidiDevice] = useState("")
  const [activeUiNotes, setActiveUiNotes] = useState<Set<number>>(new Set())
  const activeKeyNotesRef = useRef<Map<string, number>>(new Map())

  const {
    isInitialized,
    initializeAudio,
    noteOn,
    noteOff,
    stopAllVoices,
    displayNote,
    volume,
    setVolume,
    useReverb,
    setUseReverb,
    transpose,
    setTranspose,
    octaveShift,
    setOctaveShift,
    activeTone,
    setActiveTone,
  } = useAudioEngine()

  const markNoteActive = useCallback((midiNote: number) => {
    setActiveUiNotes((prev) => {
      const next = new Set(prev)
      next.add(midiNote)
      return next
    })
  }, [])

  const markNoteInactive = useCallback((midiNote: number) => {
    setActiveUiNotes((prev) => {
      const next = new Set(prev)
      next.delete(midiNote)
      return next
    })
  }, [])

  const playFromUi = useCallback(
    (midiNote: number, velocity?: number) => {
      noteOn(midiNote, velocity)
      markNoteActive(midiNote)
    },
    [markNoteActive, noteOn],
  )

  const releaseFromUi = useCallback(
    (midiNote: number) => {
      noteOff(midiNote)
      markNoteInactive(midiNote)
    },
    [markNoteInactive, noteOff],
  )

  const { midiSupported, devices } = useMIDIController({
    onNoteOn: (note, velocity) => {
      noteOn(note, velocity)
      markNoteActive(displayNote(note))
    },
    onNoteOff: (note) => {
      noteOff(note)
      markNoteInactive(displayNote(note))
    },
    selectedDeviceId: selectedMidiDevice,
  })

  useEffect(() => {
    initializeAudio().finally(() => setReady(true))
  }, [initializeAudio])

  useEffect(() => {
    setActiveUiNotes(new Set())
    activeKeyNotesRef.current.clear()
  }, [transpose, octaveShift])

  const keyboardHelp = useMemo(
    () => [
      "Play: 1-0 and Q-P",
      "Volume: Alt + ArrowUp / ArrowDown",
      "Octave: Ctrl + Alt + ArrowUp / ArrowDown",
      "Transpose: Ctrl + Alt + ArrowLeft / ArrowRight",
      "Reverb: Ctrl + Alt + R",
    ],
    [],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!ready || event.repeat) return

      if (event.altKey && !event.ctrlKey) {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault()
          setVolume((value) =>
            event.key === "ArrowUp"
              ? Math.min(100, value + 5)
              : Math.max(0, value - 5),
          )
        }
        return
      }

      if (event.altKey && event.ctrlKey) {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault()
          setOctaveShift((value) =>
            event.key === "ArrowUp"
              ? Math.min(2, value + 1)
              : Math.max(-2, value - 1),
          )
        }

        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault()
          setTranspose((value) =>
            event.key === "ArrowRight"
              ? Math.min(11, value + 1)
              : Math.max(-11, value - 1),
          )
        }

        if (event.key.toLowerCase() === "r") {
          event.preventDefault()
          setUseReverb((value) => !value)
        }

        return
      }

      const key = event.key.toLowerCase()
      const midiNote = COMPUTER_KEY_MAP[key]
      if (midiNote === undefined || activeKeyNotesRef.current.has(key)) return

      event.preventDefault()
      activeKeyNotesRef.current.set(key, midiNote)
      playFromUi(midiNote, 100)
    },
    [playFromUi, ready, setOctaveShift, setTranspose, setUseReverb, setVolume],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!ready) return

      const key = event.key.toLowerCase()
      const midiNote = activeKeyNotesRef.current.get(key)
      if (midiNote === undefined) return

      activeKeyNotesRef.current.delete(key)
      releaseFromUi(midiNote)
    },
    [ready, releaseFromUi],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", stopAllVoices)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", stopAllVoices)
    }
  }, [handleKeyDown, handleKeyUp, stopAllVoices])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f5f5f4,transparent_45%),linear-gradient(180deg,#fafaf9_0%,#f1f5f9_100%)] px-4 py-6 text-zinc-950 dark:bg-[radial-gradient(circle_at_top,#27272a,transparent_35%),linear-gradient(180deg,#09090b_0%,#18181b_100%)] dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-white/80 p-5 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                Browser Synth
              </p>
              <h1 className="font-serif text-4xl tracking-tight">Web Piano</h1>
              <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
                FM electric piano with Rhodes and Wurlitzer voicings, MIDI input,
                reverb, transpose, and octave control.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge>{activeTone === "rhodes" ? "Rhodes" : "Wurlitzer"}</Badge>
              <Badge variant="outline">Oct {octaveShift >= 0 ? `+${octaveShift}` : octaveShift}</Badge>
              <Badge variant={midiSupported ? "secondary" : "outline"}>
                {midiSupported ? "MIDI Ready" : "No MIDI"}
              </Badge>
              <Button
                variant="outline"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {keyboardHelp.map((item) => (
              <span
                key={item}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {item}
              </span>
            ))}
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="flex min-h-[420px] flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white/85 p-5 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Keyboard</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Click, tap, type, or use a MIDI controller.
                </p>
              </div>
              <Badge variant={isInitialized ? "secondary" : "outline"}>
                {isInitialized ? "Audio Ready" : "Initializing"}
              </Badge>
            </div>

            <PianoKeyboard
              noteOn={playFromUi}
              noteOff={releaseFromUi}
              activeNotes={activeUiNotes}
            />
          </div>

          <ControlPanel
            volume={volume}
            onVolumeChange={setVolume}
            useReverb={useReverb}
            onReverbChange={setUseReverb}
            transpose={transpose}
            onTransposeChange={setTranspose}
            octaveShift={octaveShift}
            onOctaveShiftChange={setOctaveShift}
            activeTone={activeTone}
            onToneChange={setActiveTone}
            midiSupported={midiSupported}
            midiDevices={devices}
            selectedMidiDevice={selectedMidiDevice}
            onMidiDeviceChange={setSelectedMidiDevice}
          />
        </section>

        <footer className="rounded-3xl border border-zinc-200/80 bg-white/80 p-4 text-sm text-zinc-600 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.25)] dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
          The UI note highlight follows the played key, while audio pitch still
          respects transpose and octave offsets.
        </footer>
      </div>
    </main>
  )
}

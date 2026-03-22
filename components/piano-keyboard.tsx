"use client"

import { useCallback } from "react"

import { cn } from "@/lib/utils"

interface PianoKey {
  computerKey: string
  midiNote: number
  noteName: string
  label: string
  row: "top" | "bottom"
}

export const PIANO_KEYS: PianoKey[] = [
  { computerKey: "1", midiNote: 60, noteName: "C4", label: "Sa", row: "top" },
  { computerKey: "2", midiNote: 62, noteName: "D4", label: "Re", row: "top" },
  { computerKey: "3", midiNote: 64, noteName: "E4", label: "Ga", row: "top" },
  { computerKey: "4", midiNote: 65, noteName: "F4", label: "Ma", row: "top" },
  { computerKey: "5", midiNote: 67, noteName: "G4", label: "Pa", row: "top" },
  { computerKey: "6", midiNote: 69, noteName: "A4", label: "Dha", row: "top" },
  { computerKey: "7", midiNote: 71, noteName: "B4", label: "Ni", row: "top" },
  { computerKey: "8", midiNote: 72, noteName: "C5", label: "Sa", row: "top" },
  { computerKey: "9", midiNote: 74, noteName: "D5", label: "Re", row: "top" },
  { computerKey: "0", midiNote: 76, noteName: "E5", label: "Ga", row: "top" },
  { computerKey: "q", midiNote: 65, noteName: "F4", label: "Ma", row: "bottom" },
  { computerKey: "w", midiNote: 67, noteName: "G4", label: "Pa", row: "bottom" },
  { computerKey: "e", midiNote: 69, noteName: "A4", label: "Dha", row: "bottom" },
  { computerKey: "r", midiNote: 71, noteName: "B4", label: "Ni", row: "bottom" },
  { computerKey: "t", midiNote: 72, noteName: "C5", label: "Sa", row: "bottom" },
  { computerKey: "y", midiNote: 74, noteName: "D5", label: "Re", row: "bottom" },
  { computerKey: "u", midiNote: 76, noteName: "E5", label: "Ga", row: "bottom" },
  { computerKey: "i", midiNote: 77, noteName: "F5", label: "Ma", row: "bottom" },
  { computerKey: "o", midiNote: 79, noteName: "G5", label: "Pa", row: "bottom" },
  { computerKey: "p", midiNote: 81, noteName: "A5", label: "Dha", row: "bottom" },
]

interface PianoKeyboardProps {
  noteOn: (midiNote: number, velocity?: number) => void
  noteOff: (midiNote: number) => void
  activeNotes: Set<number>
}

function PianoKeyButton({
  pianoKey,
  activeNotes,
  noteOn,
  noteOff,
}: PianoKeyboardProps & { pianoKey: PianoKey }) {
  const handlePress = useCallback(() => {
    noteOn(pianoKey.midiNote, 100)
  }, [noteOn, pianoKey.midiNote])

  const handleRelease = useCallback(() => {
    noteOff(pianoKey.midiNote)
  }, [noteOff, pianoKey.midiNote])

  return (
    <button
      className={cn(
        "group relative flex h-32 w-11 select-none flex-col justify-between rounded-b-[1.6rem] rounded-t-[0.9rem] border px-2 py-3 text-left shadow-[inset_0_-18px_26px_rgba(15,23,42,0.08)] transition duration-100 ease-out sm:h-36 sm:w-14",
        "border-zinc-300 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 hover:translate-y-[1px] dark:border-zinc-700 dark:from-zinc-50 dark:via-zinc-100 dark:to-zinc-200",
        activeNotes.has(pianoKey.midiNote) &&
          "translate-y-[2px] border-zinc-400 bg-zinc-200 shadow-[inset_0_-10px_18px_rgba(15,23,42,0.15)] dark:border-zinc-500 dark:bg-zinc-300",
      )}
      type="button"
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchEnd={(event) => {
        event.preventDefault()
        handleRelease()
      }}
      onTouchStart={(event) => {
        event.preventDefault()
        handlePress()
      }}
    >
      <span className="self-start rounded-full bg-zinc-900 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white dark:bg-zinc-800">
        {pianoKey.computerKey}
      </span>
      <span className="space-y-0.5 text-center">
        <span className="block text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">
          {pianoKey.noteName}
        </span>
        <span className="block text-base font-semibold text-zinc-900">
          {pianoKey.label}
        </span>
      </span>
    </button>
  )
}

export function PianoKeyboard({
  noteOn,
  noteOff,
  activeNotes,
}: PianoKeyboardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto flex min-w-max flex-col gap-3 rounded-[2rem] border border-zinc-200 bg-zinc-100/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
        {(["top", "bottom"] as const).map((row) => (
          <div key={row} className="flex justify-center gap-1.5">
            {PIANO_KEYS.filter((key) => key.row === row).map((pianoKey) => (
              <PianoKeyButton
                key={`${row}-${pianoKey.computerKey}`}
                activeNotes={activeNotes}
                noteOff={noteOff}
                noteOn={noteOn}
                pianoKey={pianoKey}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

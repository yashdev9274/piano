"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MidiDevice {
  id: string
  name: string
}

interface ControlPanelProps {
  volume: number
  onVolumeChange: (value: number) => void
  useReverb: boolean
  onReverbChange: (value: boolean) => void
  transpose: number
  onTransposeChange: (value: number) => void
  octaveShift: number
  onOctaveShiftChange: (value: number) => void
  activeTone: "rhodes" | "wurlitzer"
  onToneChange: (value: "rhodes" | "wurlitzer") => void
  midiSupported: boolean
  midiDevices: MidiDevice[]
  selectedMidiDevice: string
  onMidiDeviceChange: (value: string) => void
}

const transposeOptions = Array.from({ length: 23 }, (_, index) => index - 11)
const octaveOptions = [-2, -1, 0, 1, 2]

export function ControlPanel({
  volume,
  onVolumeChange,
  useReverb,
  onReverbChange,
  transpose,
  onTransposeChange,
  octaveShift,
  onOctaveShiftChange,
  activeTone,
  onToneChange,
  midiSupported,
  midiDevices,
  selectedMidiDevice,
  onMidiDeviceChange,
}: ControlPanelProps) {
  return (
    <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Volume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-4xl font-semibold tabular-nums">{volume}%</div>
          <input
            aria-label="Volume"
            className="slider"
            max={100}
            min={0}
            step={1}
            type="range"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reverb</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-medium">Generated room response</span>
            <button
              aria-pressed={useReverb}
              className={cn("toggle", useReverb && "toggle-active")}
              type="button"
              onClick={() => onReverbChange(!useReverb)}
            >
              <span className="toggle-thumb" />
            </button>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tone</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {(["rhodes", "wurlitzer"] as const).map((tone) => (
            <button
              key={tone}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition",
                activeTone === tone
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
              )}
              type="button"
              onClick={() => onToneChange(tone)}
            >
              {tone}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transpose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-4xl font-semibold tabular-nums">
            {transpose > 0 ? `+${transpose}` : transpose}
          </div>
          <select
            className="field"
            value={String(transpose)}
            onChange={(event) => onTransposeChange(Number(event.target.value))}
          >
            {transposeOptions.map((option) => (
              <option key={option} value={option}>
                {option > 0 ? `+${option}` : option}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Octave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-4xl font-semibold tabular-nums">
            {octaveShift > 0 ? `+${octaveShift}` : octaveShift}
          </div>
          <select
            className="field"
            value={String(octaveShift)}
            onChange={(event) => onOctaveShiftChange(Number(event.target.value))}
          >
            {octaveOptions.map((option) => (
              <option key={option} value={option}>
                {option > 0 ? `+${option}` : option}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            MIDI
            <Badge variant={midiSupported ? "secondary" : "outline"}>
              {midiSupported ? "Supported" : "Unavailable"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {midiDevices.length > 0 ? (
            <select
              className="field"
              value={selectedMidiDevice}
              onChange={(event) => onMidiDeviceChange(event.target.value)}
            >
              <option value="">All detected devices</option>
              {midiDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No MIDI devices detected. Connect a controller and reload.
            </p>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface MIDIDevice {
  id: string
  name: string
}

interface NavigatorWithMIDIMethod {
  requestMIDIAccess?: (options?: { sysex?: boolean }) => Promise<MIDIAccess>
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
  const midiAccessRef = useRef<MIDIAccess | null>(null)

  const bindInputs = useCallback(() => {
    const access = midiAccessRef.current
    if (!access) return

    const detectedDevices: MIDIDevice[] = []
    for (const input of access.inputs.values()) {
      detectedDevices.push({
        id: input.id,
        name: input.name ?? input.manufacturer ?? "Unknown MIDI Device",
      })

      input.onmidimessage = (event: MIDIMessageEvent) => {
        if (selectedDeviceId && selectedDeviceId !== input.id) return
        if (!event.data || event.data.length < 2) return

        const [status, note, velocity = 0] = event.data
        const command = status & 0xf0

        if (command === 0x90 && velocity > 0) {
          onNoteOn(note, velocity)
        } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
          onNoteOff(note)
        }
      }
    }

    setDevices(detectedDevices)
  }, [onNoteOff, onNoteOn, selectedDeviceId])

  const initializeMIDI = useCallback(async () => {
    const navigatorWithMIDI = navigator as Navigator & NavigatorWithMIDIMethod
    if (typeof navigator === "undefined" || !navigatorWithMIDI.requestMIDIAccess) {
      setMidiSupported(false)
      return
    }

    try {
      const access = await navigatorWithMIDI.requestMIDIAccess({ sysex: false })
      midiAccessRef.current = access
      setMidiSupported(true)
      bindInputs()
      access.onstatechange = () => bindInputs()
    } catch {
      setMidiSupported(false)
    }
  }, [bindInputs])

  useEffect(() => {
    void initializeMIDI()

    return () => {
      if (!midiAccessRef.current) return
      for (const input of midiAccessRef.current.inputs.values()) {
        input.onmidimessage = null
      }
      midiAccessRef.current.onstatechange = null
    }
  }, [initializeMIDI])

  return { midiSupported, devices }
}

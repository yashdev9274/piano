"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface Voice {
  carrier: OscillatorNode | null
  modulator: OscillatorNode | null
  modulatorGain: GainNode | null
  envelope: GainNode | null
  filter: BiquadFilterNode | null
  note: number
  startTime: number
  isActive: boolean
}

interface SynthesisParams {
  attack: number
  decay: number
  sustain: number
  release: number
  modIndex: number
  modRatio: number
  filterFreq: number
  filterQ: number
  detune: number
}

const PRESETS: Record<"rhodes" | "wurlitzer", SynthesisParams> = {
  rhodes: {
    attack: 0.005,
    decay: 0.35,
    sustain: 0.32,
    release: 0.6,
    modIndex: 2.1,
    modRatio: 2,
    filterFreq: 4300,
    filterQ: 0.8,
    detune: 3,
  },
  wurlitzer: {
    attack: 0.004,
    decay: 0.2,
    sustain: 0.24,
    release: 0.4,
    modIndex: 3.25,
    modRatio: 3.5,
    filterFreq: 3400,
    filterQ: 1.1,
    detune: 5,
  },
}

const MAX_VOICES = 16

function midiToFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12)
}

function createEmptyVoice(): Voice {
  return {
    carrier: null,
    modulator: null,
    modulatorGain: null,
    envelope: null,
    filter: null,
    note: -1,
    startTime: 0,
    isActive: false,
  }
}

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const reverbMixRef = useRef<GainNode | null>(null)
  const dryMixRef = useRef<GainNode | null>(null)
  const reverbNodeRef = useRef<ConvolverNode | null>(null)
  const voicesRef = useRef<Voice[]>(Array.from({ length: MAX_VOICES }, createEmptyVoice))

  const [isInitialized, setIsInitialized] = useState(false)
  const [volume, setVolume] = useState(74)
  const [useReverb, setUseReverb] = useState(true)
  const [transpose, setTranspose] = useState(0)
  const [octaveShift, setOctaveShift] = useState(0)
  const [activeTone, setActiveTone] = useState<"rhodes" | "wurlitzer">("rhodes")

  const initializeAudio = useCallback(async () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
      }
      setIsInitialized(true)
      return
    }

    const AudioContextCtor =
      window.AudioContext ||
      (
        window as Window & {
          webkitAudioContext?: typeof AudioContext
        }
      ).webkitAudioContext

    if (!AudioContextCtor) return

    const context = new AudioContextCtor()
    const masterGain = context.createGain()
    const dryMix = context.createGain()
    const reverbMix = context.createGain()
    const reverbNode = context.createConvolver()

    masterGain.gain.value = volume / 100
    dryMix.gain.value = useReverb ? 0.85 : 1
    reverbMix.gain.value = useReverb ? 0.22 : 0

    reverbNode.buffer = createImpulseResponse(context, 1.8, 2.6)

    masterGain.connect(dryMix)
    masterGain.connect(reverbMix)
    dryMix.connect(context.destination)
    reverbMix.connect(reverbNode)
    reverbNode.connect(context.destination)

    audioContextRef.current = context
    masterGainRef.current = masterGain
    dryMixRef.current = dryMix
    reverbMixRef.current = reverbMix
    reverbNodeRef.current = reverbNode

    setIsInitialized(true)
  }, [useReverb, volume])

  const stopVoice = useCallback(
    (voice: Voice, releaseOverride?: number) => {
      const context = audioContextRef.current
      if (!context || !voice.isActive || !voice.envelope || !voice.modulatorGain) return

      const release = releaseOverride ?? PRESETS[activeTone].release
      const now = context.currentTime

      voice.envelope.gain.cancelScheduledValues(now)
      voice.envelope.gain.setTargetAtTime(0.0001, now, Math.max(release / 5, 0.01))

      voice.modulatorGain.gain.cancelScheduledValues(now)
      voice.modulatorGain.gain.setTargetAtTime(0.0001, now, Math.max(release / 6, 0.01))

      const stopAt = now + release + 0.08

      voice.carrier?.stop(stopAt)
      voice.modulator?.stop(stopAt)
      voice.isActive = false

      window.setTimeout(() => {
        voice.carrier?.disconnect()
        voice.modulator?.disconnect()
        voice.modulatorGain?.disconnect()
        voice.envelope?.disconnect()
        voice.filter?.disconnect()
        Object.assign(voice, createEmptyVoice())
      }, (release + 0.12) * 1000)
    },
    [activeTone],
  )

  const allocateVoice = useCallback(() => {
    const freeVoice = voicesRef.current.find((voice) => !voice.isActive)
    if (freeVoice) return freeVoice

    const oldestVoice = voicesRef.current.reduce((oldest, voice) =>
      voice.startTime < oldest.startTime ? voice : oldest,
    )

    stopVoice(oldestVoice, 0.05)
    Object.assign(oldestVoice, createEmptyVoice())
    return oldestVoice
  }, [stopVoice])

  const startVoice = useCallback(
    (midiNote: number, velocity = 100) => {
      const context = audioContextRef.current
      const masterGain = masterGainRef.current
      if (!context || !masterGain) return

      const preset = PRESETS[activeTone]
      const voice = allocateVoice()
      const frequency = midiToFrequency(midiNote)
      const now = context.currentTime
      const velocityGain = 0.3 + (Math.min(velocity, 127) / 127) * 0.7

      const modulator = context.createOscillator()
      modulator.type = "sine"
      modulator.frequency.value = frequency * preset.modRatio

      const modulatorGain = context.createGain()
      modulatorGain.gain.value = 0

      const carrier = context.createOscillator()
      carrier.type = "sine"
      carrier.frequency.value = frequency
      carrier.detune.value = preset.detune

      const envelope = context.createGain()
      envelope.gain.value = 0

      const filter = context.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = preset.filterFreq
      filter.Q.value = preset.filterQ

      modulator.connect(modulatorGain)
      modulatorGain.connect(carrier.frequency)
      carrier.connect(envelope)
      envelope.connect(filter)
      filter.connect(masterGain)

      const peakModulation = frequency * preset.modRatio * preset.modIndex

      modulatorGain.gain.setValueAtTime(0.0001, now)
      modulatorGain.gain.linearRampToValueAtTime(peakModulation, now + preset.attack)
      modulatorGain.gain.exponentialRampToValueAtTime(
        peakModulation * preset.sustain + 0.0001,
        now + preset.attack + preset.decay,
      )

      envelope.gain.setValueAtTime(0.0001, now)
      envelope.gain.linearRampToValueAtTime(velocityGain, now + preset.attack)
      envelope.gain.exponentialRampToValueAtTime(
        velocityGain * preset.sustain + 0.0001,
        now + preset.attack + preset.decay,
      )

      modulator.start(now)
      carrier.start(now)

      Object.assign(voice, {
        carrier,
        modulator,
        modulatorGain,
        envelope,
        filter,
        note: midiNote,
        startTime: now,
        isActive: true,
      })
    },
    [activeTone, allocateVoice],
  )

  const noteOn = useCallback(
    async (midiNote: number, velocity = 100) => {
      await initializeAudio()

      const context = audioContextRef.current
      if (!context) return

      if (context.state === "suspended") {
        await context.resume()
      }

      startVoice(midiNote + transpose + octaveShift * 12, velocity)
    },
    [initializeAudio, octaveShift, startVoice, transpose],
  )

  const noteOff = useCallback(
    (midiNote: number) => {
      const targetNote = midiNote + transpose + octaveShift * 12
      const voice = voicesRef.current.find((item) => item.isActive && item.note === targetNote)
      if (voice) {
        stopVoice(voice)
      }
    },
    [octaveShift, stopVoice, transpose],
  )

  const stopAllVoices = useCallback(() => {
    voicesRef.current.forEach((voice) => stopVoice(voice, 0.08))
  }, [stopVoice])

  const displayNote = useCallback(
    (midiNote: number) => midiNote - transpose - octaveShift * 12,
    [octaveShift, transpose],
  )

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume / 100, 0, 0.01)
    }
  }, [volume])

  useEffect(() => {
    if (dryMixRef.current && reverbMixRef.current) {
      dryMixRef.current.gain.value = useReverb ? 0.85 : 1
      reverbMixRef.current.gain.value = useReverb ? 0.22 : 0
    }
  }, [useReverb])

  useEffect(() => {
    return () => {
      stopAllVoices()
      void audioContextRef.current?.close()
    }
  }, [stopAllVoices])

  return {
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
  }
}

function createImpulseResponse(
  context: AudioContext,
  duration: number,
  decay: number,
) {
  const length = context.sampleRate * duration
  const impulse = context.createBuffer(2, length, context.sampleRate)

  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel)
    for (let index = 0; index < length; index += 1) {
      const sample = Math.random() * 2 - 1
      data[index] = sample * (1 - index / length) ** decay
    }
  }

  return impulse
}

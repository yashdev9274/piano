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
  tone: "rhodes" | "wurlitzer"
  releasing: boolean
  releasingAt: number
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
    attack: 0.008,
    decay: 0.35,
    sustain: 0.35,
    release: 0.5,
    modIndex: 2.1,
    modRatio: 2,
    filterFreq: 4300,
    filterQ: 0.8,
    detune: 3,
  },
  wurlitzer: {
    attack: 0.006,
    decay: 0.18,
    sustain: 0.3,
    release: 0.35,
    modIndex: 1.8,
    modRatio: 2.0,
    filterFreq: 3200,
    filterQ: 0.9,
    detune: 4,
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
    tone: "rhodes",
    releasing: false,
    releasingAt: 0,
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

      const release = releaseOverride ?? PRESETS[voice.tone].release
      const now = context.currentTime
      const releaseTime = Math.max(release, 0.05)

      voice.envelope.gain.cancelScheduledValues(now)
      voice.envelope.gain.setTargetAtTime(0.0001, now, releaseTime / 3)

      voice.modulatorGain.gain.cancelScheduledValues(now)
      voice.modulatorGain.gain.setTargetAtTime(0.0001, now, releaseTime / 3)

      const stopAt = now + releaseTime + 0.05
      voice.carrier?.stop(stopAt)
      voice.modulator?.stop(stopAt)
      voice.isActive = false
      voice.releasing = true
      voice.releasingAt = now

      const cleanupDelay = (releaseTime + 0.15) * 1000
      window.setTimeout(() => {
        voice.carrier?.disconnect()
        voice.modulator?.disconnect()
        voice.modulatorGain?.disconnect()
        voice.envelope?.disconnect()
        voice.filter?.disconnect()
        voice.carrier = null
        voice.modulator = null
        voice.modulatorGain = null
        voice.envelope = null
        voice.filter = null
        voice.releasing = false
      }, cleanupDelay)
    },
    [],
  )

  const allocateVoice = useCallback(() => {
    const freeVoice = voicesRef.current.find(
      (voice) => !voice.isActive && !voice.releasing,
    )
    if (freeVoice) return freeVoice

    const oldestNonReleasingVoice = voicesRef.current
      .filter((voice) => !voice.releasing)
      .reduce(
        (oldest, voice) =>
          voice.startTime < oldest.startTime ? voice : oldest,
      )

    if (!oldestNonReleasingVoice) {
      const oldestVoice = voicesRef.current.reduce(
        (oldest, voice) =>
          voice.startTime < oldest.startTime ? voice : oldest,
      )
      stopVoice(oldestVoice, 0.02)
      return oldestVoice
    }

    if (oldestNonReleasingVoice.isActive) {
      stopVoice(oldestNonReleasingVoice, 0.03)
    }
    Object.assign(oldestNonReleasingVoice, createEmptyVoice())
    return oldestNonReleasingVoice
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
      const attackTime = Math.max(preset.attack, 0.008)

      modulatorGain.gain.setValueAtTime(0.0001, now)
      modulatorGain.gain.exponentialRampToValueAtTime(
        Math.max(peakModulation, 0.0001),
        now + attackTime,
      )
      modulatorGain.gain.exponentialRampToValueAtTime(
        Math.max(peakModulation * preset.sustain, 0.0001),
        now + attackTime + preset.decay,
      )

      envelope.gain.setValueAtTime(0.0001, now)
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(velocityGain, 0.0001),
        now + attackTime,
      )
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(velocityGain * preset.sustain, 0.0001),
        now + attackTime + preset.decay,
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
        tone: activeTone,
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

# Web Piano

Web Piano is a browser-based electric piano synthesizer built with Next.js and the Web Audio API. It uses two-operator FM synthesis for Rhodes and Wurlitzer-inspired tones and supports mouse, touch, computer keyboard, and Web MIDI input.

## Features

- Pure Web Audio FM synthesis with 16-voice polyphony
- Rhodes and Wurlitzer voicings
- Volume, reverb, transpose, and octave controls
- Two-row playable keyboard mapped to `1-0` and `Q-P`
- Web MIDI device selection
- Responsive light and dark themes

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Controls

- Play notes: `1-0` and `Q-P`
- Volume: `Alt + ArrowUp` / `Alt + ArrowDown`
- Octave: `Ctrl + Alt + ArrowUp` / `Ctrl + Alt + ArrowDown`
- Transpose: `Ctrl + Alt + ArrowLeft` / `Ctrl + Alt + ArrowRight`
- Reverb: `Ctrl + Alt + R`

## Notes

- Browsers may require a user gesture before audio starts.
- Web MIDI support depends on browser and device availability.

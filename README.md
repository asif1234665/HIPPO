# Viral Music Generator

A web‑only application that lets users generate music inspired by current Spotify top‑charts trends. The music is created using the open‑source **Magenta.js** library (MusicRNN) and is released under the **CC0 (Public Domain)** license, ensuring it cannot be copyrighted.

## Features
- Displays a list of the current Spotify Top Charts (mock data).
- Generates a short music piece (MIDI) based on the selected trend.
- Plays the generated music in‑browser with **Tone.js** and visualises it.
- Allows downloading the generated audio as a WAV file.
- All content is CC0, free to share and use.

## Project Structure
```
viral_music_generator/
│   index.html
│   index.css
│   script.js
│   trends.json
│   LICENSE
│   README.md
```

## Getting Started
1. Open `index.html` in a modern browser.
2. Choose a trending track.
3. Click **Generate Music**.
4. Listen, visualise, and download the result.

No server setup is required – the app runs entirely client‑side.

// script.js
// This script powers the Viral Music Generator web app.
// It fetches trending tracks, calls the HuggingFace MusicGen model (similar to Suno AI),
// plays the generated audio, visualises a waveform, and creates a simple video (audio + animated waveform).

const trendSelect = document.getElementById('trendSelect');
const generateBtn = document.getElementById('generateBtn');
const playerSection = document.getElementById('playerSection');
const audioPlayer = document.getElementById('audioPlayer');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.createElement('canvas');
canvas.id = 'waveformCanvas';
canvas.width = 600;
canvas.height = 120;
playerSection.appendChild(canvas);
const ctx = canvas.getContext('2d');

// --------------------- Load trends ---------------------
async function loadTrends() {
  // In a real app, fetch from a live source (Spotify API). Here we use a static JSON.
  const response = await fetch('trends.json');
  const trends = await response.json();
  trends.forEach((trend) => {
    const opt = document.createElement('option');
    opt.value = trend.id;
    opt.textContent = trend.name;
    trendSelect.appendChild(opt);
  });
}

loadTrends();

// --------------------- Music Generation ---------------------
// Replace `YOUR_HF_API_TOKEN` with a valid HuggingFace inference token.
const HF_TOKEN = 'YOUR_HF_API_TOKEN'; // <-- TODO: add your token
const HF_ENDPOINT = 'https://api-inference.huggingface.co/models/facebook/musicgen-medium'; // MusicGen model similar to Suno AI

async function generateMusic(prompt) {
  const res = await fetch(HF_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: prompt, parameters: { duration_seconds: 15 } }),
  });
  if (!res.ok) {
    throw new Error('Music generation failed: ' + res.statusText);
  }
  // The API returns raw audio (wav) binary.
  const arrayBuffer = await res.arrayBuffer();
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function drawWaveform(buffer) {
  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / canvas.width);
  const amp = canvas.height / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  for (let i = 0; i < canvas.width; i++) {
    const min = data[i * step];
    const y = (1 + min) * amp;
    ctx.fillRect(i, y, 1, 2);
  }
}

// --------------------- Video Recording ---------------------
let mediaRecorder;
let recordedChunks = [];

function startRecording(stream) {
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9,opus' });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.start();
}

function stopRecording() {
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      resolve(blob);
    };
    mediaRecorder.stop();
  });
}

// --------------------- Main Flow ---------------------
generateBtn.addEventListener('click', async () => {
  const trendId = trendSelect.value;
  const trendName = trendSelect.options[trendSelect.selectedIndex].text;
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';

  try {
    const prompt = `A ${trendName} style electronic track, upbeat, suitable for TikTok, 15 seconds.`;
    const audioBlob = await generateMusic(prompt);
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;
    audioPlayer.load();
    playerSection.classList.remove('hidden');

    // Load audio into Tone.js to extract waveform data
    const buffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const array = reader.result;
        const audioContext = new AudioContext();
        const decoded = await audioContext.decodeAudioData(array);
        resolve(decoded);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(audioBlob);
    });
    drawWaveform(buffer);

    // Prepare stream: combine canvas (captureStream) + audio (via MediaElementAudioSourceNode)
    const canvasStream = canvas.captureStream(30); // 30 FPS
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaElementSource(audioPlayer);
    const dest = audioContext.createMediaStreamDestination();
    sourceNode.connect(dest);
    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);

    // Record while audio plays
    startRecording(combinedStream);
    audioPlayer.play();
    audioPlayer.onended = async () => {
      const videoBlob = await stopRecording();
      const videoUrl = URL.createObjectURL(videoBlob);
      // Offer video download
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `${trendName.replace(/\s+/g, '_')}_generated.webm`;
      a.click();
    };
  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Music';
  }
});

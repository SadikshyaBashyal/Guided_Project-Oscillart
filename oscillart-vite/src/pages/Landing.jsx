import './Landing.css';
import { useRef, useEffect, useState } from 'react';

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NOTE_FREQUENCIES = {
  C: 261.6,
  D: 293.7,
  E: 329.6,
  F: 349.2,
  G: 392.0,
  A: 440,
  B: 493.9,
};
const NOTE_NUMBERS = {
  C: 1,
  D: 2,
  E: 3,
  F: 4,
  G: 5,
  A: 6,
  B: 7,
};

const NUMBER_TO_NOTE = {
  1: 'C',
  2: 'D',
  3: 'E',
  4: 'F',
  5: 'G',
  6: 'A',
  7: 'B',
};

function Landing() {
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const animationRef = useRef(null);
  const noteTimeoutRef = useRef(null);
  const [currentNote, setCurrentNote] = useState(null);
  const pressedKeyRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    gainNodeRef.current = audioCtxRef.current.createGain();
    oscillatorRef.current = audioCtxRef.current.createOscillator();
    oscillatorRef.current.type = 'sine';
    oscillatorRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(audioCtxRef.current.destination);
    oscillatorRef.current.start();
    gainNodeRef.current.gain.value = 0;
    return () => {
      oscillatorRef.current && oscillatorRef.current.stop();
      audioCtxRef.current && audioCtxRef.current.close();
      cancelAnimationFrame(animationRef.current);
      clearTimeout(noteTimeoutRef.current);
    };
  }, []);

  // Keyboard support: press 1-7 to play notes, release to stop after 0.1s; space toggles recording
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleRecord();
        return;
      }
      const note = NUMBER_TO_NOTE[e.key];
      if (note && pressedKeyRef.current !== e.key) {
        pressedKeyRef.current = e.key;
        handleNoteStart(note);
      }
    };
    const handleKeyUp = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const note = NUMBER_TO_NOTE[e.key];
      if (note && pressedKeyRef.current === e.key) {
        pressedKeyRef.current = null;
        handleNoteStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  // Animate a flowing sine wave for the given frequency
  const animateWave = (frequency, startTime) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = '#222';
    const amplitude = height / 4;
    const yCenter = height / 2;
    const baseFreq = NOTE_FREQUENCIES['C'];
    const cycles = frequency / baseFreq;
    const waveWidth = width * 0.6;
    const xOffset = (width - waveWidth) / 2;
    const now = performance.now();
    const elapsed = (now - startTime) / 1000; // seconds
    const scrollSpeed = 2; // cycles per second
    for (let x = 0; x < waveWidth; x++) {
      const t = (x / waveWidth) * cycles * 2 * Math.PI + elapsed * scrollSpeed * 2 * Math.PI;
      const y = yCenter + amplitude * Math.sin(t);
      if (x === 0) {
        ctx.moveTo(x + xOffset, y);
      } else {
        ctx.lineTo(x + xOffset, y);
      }
    }
    ctx.stroke();
    animationRef.current = requestAnimationFrame(() => animateWave(frequency, startTime));
  };

  // Start note and animation
  const handleNoteStart = (note) => {
    const freq = NOTE_FREQUENCIES[note];
    const audioCtx = audioCtxRef.current;
    const oscillator = oscillatorRef.current;
    const gainNode = gainNodeRef.current;
    cancelAnimationFrame(animationRef.current);
    clearTimeout(noteTimeoutRef.current);
    setCurrentNote(note);
    if (audioCtx.state === 'suspended') audioCtx.resume();
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    const startTime = performance.now();
    animateWave(freq, startTime);
  };

  // Stop note and animation after 0.1s
  const handleNoteStop = () => {
    const audioCtx = audioCtxRef.current;
    const gainNode = gainNodeRef.current;
    clearTimeout(noteTimeoutRef.current);
    noteTimeoutRef.current = setTimeout(() => {
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      cancelAnimationFrame(animationRef.current);
      setCurrentNote(null);
    }, 500); 
  };

  // Mouse click support for buttons (acts like tap: play for 0.1s)
  const handleButtonClick = (note) => {
    handleNoteStart(note);
    handleNoteStop();
  };

  // Recording logic
  const handleRecord = () => {
    if (!isRecording) {
      // Start recording
      const canvas = canvasRef.current;
      const audioCtx = audioCtxRef.current;
      const gainNode = gainNodeRef.current;
      const canvasStream = canvas.captureStream(30);
      const audioDestination = audioCtx.createMediaStreamDestination();
      gainNode.connect(audioDestination);
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      audioDestination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      const mediaRecorder = new window.MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        a.click();
        URL.revokeObjectURL(url);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } else {
      // Stop recording
      mediaRecorderRef.current && mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="Instructions">
        <h2>Instructions</h2>
        <ul>
          <li>Click a note button (A-G) or press 1-7 to play and visualize a note. Release the key to stop after 0.1 second.</li>
          <li>Click "Start Recording" or press Space to record your session, and click/press again to stop and download.</li>
          <li>Use the canvas to view the waveforms of the notes you play. Pressing a new key interrupts the previous note instantly.</li>
        </ul>
      </div>
      <div className="landing-content">
        <canvas ref={canvasRef} className="landing-canvas" width="500" height="100"></canvas>
        <div className="note-buttons">
          {NOTE_NAMES.map((note) => (
            <button key={note} onClick={() => handleButtonClick(note)} className="note-btn">
              {note} <span style={{fontSize: '0.9em', color: '#888'}}>({NOTE_NUMBERS[note]})</span>
            </button>
          ))}
        </div>
        <button className="record-btn" onClick={handleRecord}>
          {isRecording ? 'Stop Recording (Space)' : 'Start Recording (Space)'}
        </button>
      </div>
    </div>
  );
}

export default Landing; 
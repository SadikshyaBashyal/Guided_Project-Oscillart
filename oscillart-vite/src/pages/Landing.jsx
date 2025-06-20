import './Landing.css';
import { useRef, useEffect, useState } from 'react';

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function Landing() {
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  // Placeholder for future oscillation/recording logic
  const handleNoteClick = (note) => {
    // Will play note and draw wave
  };

  const handleRecord = () => {
    setIsRecording((prev) => !prev);
    // Will start/stop recording
  };

  return (
    <div className="landing-container">
      <div className="Instructions">
        <h2>Instructions</h2>
        <ul>
          <li>Click a note button (A-G) to play and visualize a note.</li>
          <li>Click "Start Recording" to record your session, and "Stop Recording" to finish.</li>
          <li>Use the canvas to view the waveforms of the notes you play.</li>
        </ul>
      </div>
      <div className="landing-content">
        <canvas ref={canvasRef} className="landing-canvas" width="500" height="100"></canvas>
        <div className="note-buttons">
          {NOTE_NAMES.map((note) => (
            <button key={note} onClick={() => handleNoteClick(note)} className="note-btn">{note}</button>
          ))}
        </div>
        <button className="record-btn" onClick={handleRecord}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
    </div>
  );
}

export default Landing; 
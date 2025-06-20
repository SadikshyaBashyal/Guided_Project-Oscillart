// define canvas variables
let reset = false;
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var width = ctx.canvas.width;
var height = ctx.canvas.height;
var counter = 0;
var interval = null;
var timepernote = 0;
var length = 0;
const color_picker = document.getElementById('color');
const vol_slider = document.getElementById('vol-slider');
const recording_toggle = document.getElementById('record');

// Add variables for scrolling wave display
var x = 0;
var y = height/2;
var scrollOffset = 0;
var waveData = []; // Store wave points for scrolling
var freq = 0; // Add missing freq variable
var setting = null; // Add missing setting variable
var repeat = null; // Add missing repeat variable
var isSlidingMode = false; // Track if we're in sliding mode

var blob, recorder = null;
var chunks = [];

function startRecording(){
    const canvasStream = canvas.captureStream(20);
    const audioDestination = audioCtx.createMediaStreamDestination();
    gainNode.connect(audioDestination);
    
    const combinedStream = new MediaStream();
    canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
    audioDestination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
    
    recorder = new MediaRecorder(combinedStream, {mimeType: 'video/webm'});
    recorder.ondataavailable = e => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        a.click();
        URL.revokeObjectURL(url);
    };

    recorder.start();
}

var is_recording = false;
function toggle(){
    is_recording = !is_recording;
    if(is_recording){
        recording_toggle.innerHTML = "Stop Recording";
        if (repeat) {
            clearInterval(repeat);
        }
        if (interval) {
            clearInterval(interval);
        }
        if (setting) {
            clearInterval(setting);
        }
        startRecording();
        playRecordingSequence();
    } else {
        recording_toggle.innerHTML = "Start Recording";
        recorder.stop();
    }
}

function line(){
    if (isSlidingMode) {
        // Slide mode - start from left, move continuously, slide only when reaching end
        y = height/2 + vol_slider.value * Math.sin(x * 2 * Math.PI * freq * (0.5 * length));
        
        // Store the wave point
        waveData.push({x: x, y: y});
        
        // Only start sliding when wave reaches the very end of canvas
        if (x >= width) {
            scrollOffset += 1; // Slide speed
            // Remove old points that are off-screen
            while (waveData.length > 0 && waveData[0].x < scrollOffset) {
                waveData.shift();
            }
        }
        
        // Clear canvas and redraw all visible wave points
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = color_picker.value;
        
        // Draw all visible wave points
        for (let i = 0; i < waveData.length; i++) {
            let adjustedX = waveData[i].x - scrollOffset;
            if (adjustedX >= 0 && adjustedX <= width) {
                if (i === 0) {
                    ctx.moveTo(adjustedX, waveData[i].y);
                } else {
                    ctx.lineTo(adjustedX, waveData[i].y);
                }
            }
        }
        
        ctx.stroke();
        x = x + 1;
        counter++;

        // Use constant timing
        if(counter >= (timepernote/20)){
            clearInterval(interval);
        }
    } else {
        // Compress mode - draw in fixed canvas
        y = height/2 + vol_slider.value * Math.sin(x * 2 * Math.PI * freq * (0.5 * length));
        ctx.strokeStyle = color_picker.value;
        ctx.lineTo(x, y);
        ctx.stroke();
        x = x + 1;
        counter++;

        if(counter >= (timepernote/20)){
            clearInterval(interval);
        }
    }
}

function drawWave(){
    clearInterval(interval);
    counter = 0;
    
    if (reset) {
        // Reset everything for a new wave sequence
        ctx.clearRect(0, 0, width, height);
        x = 0;
        y = height/2;
        scrollOffset = 0;
        waveData = []; // Clear stored wave data
        ctx.moveTo(x, y);
        ctx.beginPath();
    }
    
    // Use constant interval timing
    interval = setInterval(line, 20);
    reset = false;
}

const input = document.getElementById('input');

// create web audio api elements
const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();

// create Oscillator node
const oscillator = audioCtx.createOscillator();
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);
oscillator.type = "sine";

oscillator.start();
gainNode.gain.value = 0;

notenames = new Map();
notenames.set("C", 261.6);
notenames.set("D", 293.7);
notenames.set("E", 329.6);
notenames.set("F", 349.2);
notenames.set("G", 392.0);
notenames.set("A", 440);
notenames.set("B", 493.9);

function frequency(pitch){
    freq = pitch / 100; // Scale for visualization
    gainNode.gain.setValueAtTime(vol_slider.value, audioCtx.currentTime);
    setting = setInterval(() => {gainNode.gain.value = vol_slider.value}, 1);
    oscillator.frequency.setValueAtTime(pitch, audioCtx.currentTime);
    setTimeout(() => { clearInterval(setting); gainNode.gain.value = 0; }, ((timepernote)-10));
}

function handle(){
    // Clear any existing intervals first
    if (repeat) {
        clearInterval(repeat);
    }
    if (setting) {
        clearInterval(setting);
    }
    
    // Set sliding mode for submit button
    isSlidingMode = true;
    
    reset = true;
    var usernotes = String(input.value);
    length = usernotes.length;
    timepernote = (6000 / length);
    
    var noteslist = [];
    for (i = 0; i < usernotes.length; i++){
        noteslist.push(notenames.get(usernotes.charAt(i)));
    }
    
    let j = 0;
    repeat = setInterval(() => {
        if (j < noteslist.length) {
            frequency(parseInt(noteslist[j]));
            drawWave();
            j++
        } else {
            clearInterval(repeat)
        }
    }, (timepernote))
}

// Function to play recording sequence
function playRecordingSequence(){
    // Clear any existing intervals first
    if (repeat) {
        clearInterval(repeat);
    }
    if (setting) {
        clearInterval(setting);
    }
    
    // Set compress mode for recording
    isSlidingMode = false;
    
    // Reset canvas completely for recording
    ctx.clearRect(0, 0, width, height);
    x = 0;
    y = height/2;
    scrollOffset = 0;
    waveData = [];
    ctx.moveTo(x, y);
    ctx.beginPath();
    
    var usernotes = String(input.value);
    length = usernotes.length;
    timepernote = (6000 / length);
    
    var noteslist = [];
    for (i = 0; i < usernotes.length; i++){
        noteslist.push(notenames.get(usernotes.charAt(i)));
    }
    
    let j = 0;
    repeat = setInterval(() => {
        if (j < noteslist.length) {
            frequency(parseInt(noteslist[j]));
            drawWave();
            j++
        } else {
            clearInterval(repeat);
            // Stop recording when final note is played
            if (is_recording) {
                toggle(); // This will stop the recording
            }
        }
    }, (timepernote))
}

// Add this event listener to resume audio context on first user interaction
document.addEventListener('click', function() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });

// Dynamically create note buttons (A-G)
const noteButtonsDiv = document.getElementById('note-buttons');
const noteNames = Array.from(notenames.keys());
let currentNoteTimeout = null;

noteNames.forEach(note => {
    const btn = document.createElement('button');
    btn.textContent = note;
    btn.className = 'note-btn';
    btn.onclick = () => playSingleNote(note);
    noteButtonsDiv.appendChild(btn);
});

function playSingleNote(note) {
    stopAudio(); // Stop any currently playing note
    // Set compress mode for single note
    isSlidingMode = false;
    reset = true;
    length = 1;
    timepernote = 600; // 0.6s per note
    freq = notenames.get(note) / 100;
    oscillator.frequency.setValueAtTime(notenames.get(note), audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol_slider.value, audioCtx.currentTime);
    drawWave();
    // Stop note after timepernote ms
    if (currentNoteTimeout) clearTimeout(currentNoteTimeout);
    currentNoteTimeout = setTimeout(() => {
        gainNode.gain.value = 0;
    }, timepernote);
}

// Update stopAudio to also clear currentNoteTimeout
function stopAudio() {
    // Stop any running intervals for note playback and drawing
    if (repeat) {
        clearInterval(repeat);
    }
    if (interval) {
        clearInterval(interval);
    }
    if (setting) {
        clearInterval(setting);
    }
    // Immediately silence the audio
    gainNode.gain.value = 0;
    if (currentNoteTimeout) {
        clearTimeout(currentNoteTimeout);
        currentNoteTimeout = null;
    }
}
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

var blob, recorder = null;
var chunks = [];

function startRecording(){
    const canvasStream = canvas.captureStream(20); // Frame rate of canvas
    const audioDestination = audioCtx.createMediaStreamDestination();
    gainNode.connect(audioDestination)
    canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
    audioDestination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
    const combinedStream = new MediaStream();
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
        startRecording();

    }else{
        recording_toggle.innerHTML = "Start Recording";
        recorder.stop();
    }

}

function line(){
    y = height/2 + vol_slider.value * Math.sin(x * 2  * Math.PI * freq * (0.5 * length));
    ctx.strokeStyle = color_picker.value;
    ctx.lineTo(x, y);
    ctx.stroke();
    x = x + 1;
    counter ++;

    if(counter>=(timepernote/20)){
        clearInterval(interval);
    }
}

function drawWave(){
    clearInterval(interval);
    counter = 0;
    // ctx.clearRect(0, 0, width, height);  //-> clears everything inside of our canvas, so that we get rid of any past sine waves
    // x = 0;
    // y = height/2;
    // ctx.moveTo(x, y);  //-> move our pointer to the left-most middle of our canvas, so we always start drawing a new wave from here
    // ctx.beginPath();// -> this method tells our computer that we’re ready to start painting!
    if (reset) {
       ctx.clearRect(0, 0, width, height);
       x = 0;
       y = height/2;
       ctx.moveTo(x, y);
       ctx.beginPath();
    }
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
    freq = pitch / 10000;
    gainNode.gain.setValueAtTime(vol_slider.value, audioCtx.currentTime);
    setting = setInterval(() => {gainNode.gain.value = vol_slider.value}, 1);
    oscillator.frequency.setValueAtTime(pitch, audioCtx.currentTime);
    setTimeout(() => { clearInterval(setting); gainNode.gain.value = 0; }, ((timepernote)-10));
}

audioCtx.resume();
gainNode.gain.value = 0;

function handle(){
    reset = true;
    var usernotes = String(input.value);
    length = usernotes.length;
    timepernote = (6000 / length);
    // frequency(notenames.get(usernotes));
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
    // drawWave();
}
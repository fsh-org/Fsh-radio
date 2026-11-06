const audio = document.getElementById('audio-player');
const trackCover = document.getElementById('track-cover');
const trackTitle = document.getElementById('track-title');
const trackAuthor = document.getElementById('track-author');
const canvas = document.getElementById('visualizer');

let ctx = canvas.getContext('2d');
let mediasesSupported = ('mediaSession' in navigator);

function changePlayStatus() {
  let paused = audio.paused;
  if (paused) {
    audio.load();
    audio.play();
  } else {
    audio.pause();
  }
  if (mediasesSupported) navigator.mediaSession.playbackState = paused?'playing':'paused';
  document.getElementById('play-svg').innerHTML = paused ? '<rect x="19" width="64" height="256" rx="15"/><rect x="173" width="64" height="256" rx="15"/>' : '<path d="M29 26.263C29 14.6537 41.6216 7.44498 51.6209 13.3432L224.097 115.08C233.936 120.884 233.936 135.116 224.097 140.92L51.6209 242.657C41.6216 248.555 29 241.346 29 229.737V26.263Z"/>';
}

function volumeUpdate() {
  let volume = document.getElementById('volume-in').value;
  audio.volume = Number(volume)/100;
  document.getElementById('volume-out').innerText = volume+'%';
}

let imageDef = (url, size)=>({ src: url??'https://fsh.plus/fsh.png', sizes: size, type: 'image/jpg' });

if (mediasesSupported) {
  navigator.mediaSession.setActionHandler('play', changePlayStatus);
  navigator.mediaSession.setActionHandler('pause', changePlayStatus);
}
try {
  const evtSource = new EventSource('https://api.zeno.fm/mounts/metadata/subscribe/f7qzuwipf1gvv');
  evtSource.onmessage = (event)=>{
    let data = JSON.parse(event.data).streamTitle;
    let title = data.split(' - ')[1];
    let artist = data.split(' - ')[0];
    trackTitle.innerText = title;
    trackAuthor.innerText = `By: ${artist}`;
    document.title = `${title} | Fsh radio`;

    fetch(`https://api.fsh.plus/file?url=https://api.deezer.com/search?q=${encodeURIComponent(data)}&output=json`)
      .then(info=>info.json())
      .then(info=>{
        if (!info.data[0]) {
          trackCover.src = 'https://fsh.plus/fsh.png';
          if (mediasesSupported) navigator.mediaSession.metadata = new MediaMetadata({ title, artist, artwork: [] });
          return;
        }
        info.sort((a,b)=>(a.title.toLowerCase().includes(title.toLowerCase())+a.artist.name.toLowerCase().includes(artist.toLowerCase()))-
          (b.title.toLowerCase().includes(title.toLowerCase())+b.artist.name.toLowerCase().includes(artist.toLowerCase())));
        info = info.data[0];
        trackTitle.innerText = info.title;
        trackAuthor.innerText = `By: ${info.artist.name}`;
        document.title = `${info.title_short} | Fsh radio`;
        trackCover.src = info.album.cover ?? 'https://fsh.plus/fsh.png';

        if (mediasesSupported) navigator.mediaSession.metadata = new MediaMetadata({
            title: info.title,
            artist: info.artist.name,
            artwork: [
              imageDef(info.album.cover_small, '56x56'),
              imageDef(info.album.cover, '120x120'),
              imageDef(info.album.cover_medium, '250x250'),
              imageDef(info.album.cover_big, '500x500'),
              imageDef(info.album.cover_xl, '1000x1000')
            ]
          });
      })
  };
} catch (err) {
  trackTitle.innerText = 'Could not load';
}

let audioContext = new AudioContext();
let analyser = audioContext.createAnalyser();
analyser.fftSize = Math.pow(2, Math.max(Math.min(Math.floor(Math.log2(window.innerWidth))-1, 9), 6));
analyser.smoothingTimeConstant = 0.75;
let source = audioContext.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioContext.destination);

let data = new Uint8Array(analyser.frequencyBinCount);
function draw() {
  analyser.getByteFrequencyData(data);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let width = (canvas.width-data.length)/data.length;
  for (let i=0; i<data.length; i++) {
    let height = (data[i]/255)*canvas.height;
    ctx.fillStyle = `oklch(0.75 0.5 ${(i/data.length)*320+20})`;
    ctx.fillRect(i*width+i, canvas.height-height, width, height);
  }
  requestAnimationFrame(draw);
}
draw();

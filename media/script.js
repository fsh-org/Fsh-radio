let audioPlayer = document.getElementById("audio-player");

function changePlayStatus() {
  let paused = audioPlayer.paused;
  if (paused) {
    audioPlayer.load();
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
  document.getElementById("play-svg").innerHTML = paused ? '<rect x="43" y="28" width="50" height="200" rx="10"/><rect x="163" y="28" width="50" height="200" rx="10"/>' : '<path d="M42 25.5255C42 20.8774 47.0573 17.9945 51.057 20.3627L223.281 122.337C227.205 124.661 227.205 130.339 223.281 132.663L51.057 234.637C47.0573 237.006 42 234.123 42 229.474V25.5255Z"/>';
}

function volumeUpdate() {
  let volume = document.getElementById('volume-in').value;
  document.getElementById('volume-out').innerText = volume;
  audioPlayer.volume = Number(volume)/100;
}

function imageDef(url, size) {
  return {
    src: url ?? 'https://fsh.plus/fsh.png',
    sizes: size,
    type: 'image/png'
  }
}

try {
  const evtSource = new EventSource("https://api.zeno.fm/mounts/metadata/subscribe/f7qzuwipf1gvv");
  evtSource.onmessage = (event) => {
    let title = JSON.parse(event.data).streamTitle;
    document.getElementById('track-title').innerText = title.split(' - ')[1];
    document.getElementById('track-author').innerText = 'By: '+title.split(' - ')[0];
    document.title = `${title} | Fsh radio`;

    fetch(`https://api.fsh.plus/file?url=https://api.deezer.com/search?q=${encodeURIComponent(title)}&output=json`)
      .then(res => res.json())
      .then(re => {
        if (!re.data[0]) {
          document.getElementById('track-cover').src = 'https://fsh.plus/fsh.png';
          if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: title.split(' - ')[1],
              artist: title.split(' - ')[0],
              artwork: []
            });
          }
          return;
        }
        res = re.data.filter(e=>e.title.includes(title.split(' - ')[1].split(' ')[0]))[0];
        if (!res) res = re.data[0];
        document.getElementById('track-title').innerText = res.title;
        document.title = `${res.title_short} | Fsh radio`;
        document.getElementById('track-author').innerText = 'By: '+res.artist.name;
        document.getElementById('track-cover').src = res.album.cover ?? 'https://fsh.plus/fsh.png';

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: res.title,
            artist: res.artist.name,
            artwork: [
              imageDef(res.album.cover, '96x96'),
              imageDef(res.album.cover, '128x128'),
              imageDef(res.album.cover, '192x192'),
              imageDef(res.album.cover, '256x256'),
              imageDef(res.album.cover, '384x384'),
              imageDef(res.album.cover, '512x512')
            ]
          });
        }
      })
  };
} catch (err) {
  document.getElementById('track-title').innerText = 'Could not load';
}

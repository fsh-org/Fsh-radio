let audioPlayer = document.getElementById('audio-player');

function changePlayStatus() {
  let paused = audioPlayer.paused;
  if (paused) {
    audioPlayer.load();
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
  document.getElementById('play-svg').innerHTML = paused ? '<rect x="19" width="64" height="256" rx="15"/><rect x="173" width="64" height="256" rx="15"/>' : '<path d="M29 26.263C29 14.6537 41.6216 7.44498 51.6209 13.3432L224.097 115.08C233.936 120.884 233.936 135.116 224.097 140.92L51.6209 242.657C41.6216 248.555 29 241.346 29 229.737V26.263Z"/>';
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
  const evtSource = new EventSource('https://api.zeno.fm/mounts/metadata/subscribe/f7qzuwipf1gvv');
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

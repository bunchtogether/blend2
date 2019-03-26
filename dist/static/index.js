function getEncodedUri() { // eslint-disable-line no-unused-vars
  const streamUrl = document.getElementById('stream_url').value;
  window.location.href = `/api/1.0/stream/${encodeURIComponent(streamUrl)}`;
}

function getEncodedArgs() { // eslint-disable-line no-unused-vars
  const ffmpegArgs = (document.getElementById('ffmpegArgs').value).split(/\s/);
  window.location.href = `/api/1.0/ffmpeg/${encodeURIComponent(JSON.stringify(ffmpegArgs))}`;
}

if (fetch) {
  fetch('/api/1.0/stream').then((response) => response.json()).then((body) => {
    const versionElement = document.getElementById('version');
    versionElement.textContent = `Version ${body.version}`;
  });
}

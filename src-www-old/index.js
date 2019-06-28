function getEncodedUri() { // eslint-disable-line no-unused-vars
  const streamUrl = document.getElementById('stream_url').value;
  window.location.href = `/api/1.0/stream/${encodeURIComponent(streamUrl)}`;
}

if (fetch) {
  fetch('/api/1.0/stream').then((response) => response.json()).then((body) => {
    const versionElement = document.getElementById('version');
    versionElement.textContent = `Version ${body.version}`;
  });
}

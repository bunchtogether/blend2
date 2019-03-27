// @flow

/* eslint-disable no-unused-vars */

import makeLogger from './logger';

const Route = require('route-parser');
const Client = require('../../client');

const reconnectAttempt = 0;
const totalReconnectAttempts = 0;
let reconnectAttemptResetTimeout;
const recoveryTimeout = null;

const element = document.querySelector('video');

if (!element) {
  throw new Error('Video element does not exist');
}
const windowLogger = makeLogger('Window');
const videoLogger = makeLogger('Video Element');
const mediaSourceLogger = makeLogger('Media Source');
const sourceBufferLogger = makeLogger('Source Buffer');
const websocketLogger = makeLogger('WebSocket');

window.addEventListener('unhandledrejection', (event) => {
  if (event && event.error) {
    if (event.error.stack) {
      windowLogger.error(event.error.stack);
    } else if (event.error.message) {
      windowLogger.error(event.error.message);
    } else {
      windowLogger.error('Unhandled rejection');
    }
  } else {
    windowLogger.error('Unhandled rejection');
  }
});

window.addEventListener('error', (event) => {
  if (event && event.error) {
    if (event.error.stack) {
      windowLogger.error(event.error.stack);
    } else if (event.error.message) {
      windowLogger.error(event.error.message);
    } else {
      windowLogger.error('Uncaught error');
    }
  } else {
    windowLogger.error('Uncaught error');
  }
});

element.addEventListener('resize', (event) => {
  videoLogger.info('abort', 'Sent when playback is aborted; for example, if the media is playing and is restarted from the beginning, this event is sent');
});
element.addEventListener('canplay', (event) => {
  videoLogger.info('canplay', 'Sent when enough data is available that the media can be played, at least for a couple of frames.  This corresponds to the HAVE_ENOUGH_DATA readyState');
});
element.addEventListener('canplaythrough', (event) => {
  videoLogger.info('canplaythrough', 'Sent when the ready state changes to CAN_PLAY_THROUGH, indicating that the entire media can be played without interruption, assuming the download rate remains at least at the current level. It will also be fired when playback is toggled between paused and playing. Note: Manually setting the currentTime will eventually fire a canplaythrough event in firefox. Other browsers might not fire this event');
});
element.addEventListener('durationchange', (event) => {
  videoLogger.info('durationchange', 'The metadata has loaded or changed, indicating a change in duration of the media.  This is sent, for example, when the media has loaded enough that the duration is known');
});
element.addEventListener('emptied', (event) => {
  videoLogger.info('emptied', 'The media has become empty; for example, this event is sent if the media has already been loaded (or partially loaded), and the load() method is called to reload it');
});
element.addEventListener('encrypted', (event) => {
  videoLogger.info('encrypted', ' The user agent has encountered initialization data in the media data');
});
element.addEventListener('ended', (event) => {
  videoLogger.info('ended', 'Sent when playback completes');
});
element.addEventListener('error', (event:ProgressEvent) => {
  const mediaError = element.error;
  const message = mediaError && mediaError.message ? mediaError.message : null;
  if (mediaError && message) {
    videoLogger.error(`${mediaError.code}: ${message}`);
  } else {
    videoLogger.error('error', 'Sent when an error occurs.  The element\'s error attribute contains more information. See HTMLMediaElement.error for details');
    if (event) {
      videoLogger.error(event);
    }
  }
});
element.addEventListener('interruptbegin', (event) => {
  videoLogger.info('interruptbegin', 'Sent when audio playing on a Firefox OS device is interrupted, either because the app playing the audio is sent to the background, or audio in a higher priority audio channel begins to play. See Using the AudioChannels API for more details');
});
element.addEventListener('interruptend', (event) => {
  videoLogger.info('interruptend', 'Sent when previously interrupted audio on a Firefox OS device commences playing again — when the interruption ends. This is when the associated app comes back to the foreground, or when the higher priority audio finished playing. See Using the AudioChannels API for more details');
});
element.addEventListener('loadeddata', (event) => {
  videoLogger.info('loadeddata', 'The first frame of the media has finished loading');
});
element.addEventListener('loadedmetadata', (event) => {
  videoLogger.info('loadedmetadata', 'The media\'s metadata has finished loading; all attributes now contain as much useful information as they\'re going to');
});
element.addEventListener('loadstart', (event:ProgressEvent) => {
  videoLogger.info('loadstart', 'Sent when loading of the media begins');
});
element.addEventListener('mozaudioavailable', (event) => {
  videoLogger.info('mozaudioavailable', 'Sent when an audio buffer is provided to the audio layer for processing; the buffer contains raw audio samples that may or may not already have been played by the time you receive the event');
});
element.addEventListener('pause', (event) => {
  videoLogger.info('pause', 'Sent when the playback state is changed to paused (paused property is true)');
});
element.addEventListener('play', (event) => {
  videoLogger.info('play', 'Sent when the playback state is no longer paused, as a result of the play method, or the autoplay attribute');
});
element.addEventListener('playing', (event) => {
  videoLogger.info('playing', 'Sent when the media has enough data to start playing, after the play event, but also when recovering from being stalled, when looping media restarts, and after seeked, if it was playing before seeking');
});
element.addEventListener('ratechange', (event) => {
  videoLogger.info('ratechange', 'Sent when the playback speed changes');
});
element.addEventListener('seeked', (event) => {
  videoLogger.info('seeked', 'Sent when a seek operation completes');
});
element.addEventListener('seeking', (event) => {
  videoLogger.info('seeking', 'Sent when a seek operation begins');
});
element.addEventListener('stalled', (event) => {
  videoLogger.info('stalled', 'Sent when the user agent is trying to fetch media data, but data is unexpectedly not forthcoming');
});
element.addEventListener('suspend', (event) => {
  videoLogger.info('suspend', 'Sent when loading of the media is suspended; this may happen either because the download has completed or because it has been paused for any other reason');
});
element.addEventListener('volumechange', (event) => {
  videoLogger.info('volumechange', 'Sent when the audio volume changes (both when the volume is set and when the muted attribute is changed)');
});
element.addEventListener('waiting', (event) => {
  videoLogger.info('waiting', 'Sent when the requested operation (such as playback) is delayed pending the completion of another operation (such as a seek)');
});

const logevent:EventListener = function (event) {
  console.log(event.type);
};

const route = new Route('/stream/:streamUrl/(:path)');
const parsedRoute = route.match(window.location.pathname);

async function initialize() {
  const address = `ws://127.0.0.1:61340/api/1.0/websocket/stream/${encodeURIComponent(parsedRoute.streamUrl)}`;
  const client = new Client();
  const mediaSource = new MediaSource();
  mediaSource.addEventListener('sourceopen', (event) => {
    mediaSourceLogger.info('sourceopen');
  });
  mediaSource.addEventListener('sourceended', (event) => {
    mediaSourceLogger.info('sourceended');
  });
  mediaSource.addEventListener('sourceclose', (event) => {
    mediaSourceLogger.info('sourceclose');
  });
  mediaSource.addEventListener('updatestart', (event) => {
    mediaSourceLogger.info('updatestart');
  });
  mediaSource.addEventListener('update', (event) => {
    mediaSourceLogger.info('update');
  });
  mediaSource.addEventListener('updateend', (event) => {
    mediaSourceLogger.info('updateend');
  });
  mediaSource.addEventListener('error', (event) => {
    mediaSourceLogger.info('error');
  });
  mediaSource.addEventListener('abort', (event) => {
    mediaSourceLogger.info('abort');
  });
  mediaSource.addEventListener('addsourcebuffer', (event) => {
    mediaSourceLogger.info('addsourcebuffer');
  });
  mediaSource.addEventListener('removesourcebuffer', (event) => {
    mediaSourceLogger.info('removesourcebuffer');
  });
  element.src = URL.createObjectURL(mediaSource);
  await new Promise((resolve) => {
    const handle = () => {
      mediaSource.removeEventListener('sourceopen', handle);
      resolve();
    };
    mediaSource.addEventListener('sourceopen', handle);
  });
  const queue = [];
  const buffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.64001f, mp4a.40.5"');
  buffer.addEventListener('updateend', async () => {
    console.log(`updateend: ${mediaSource.readyState}, queue: ${queue.length}`);
    if (queue.length > 0 && !buffer.updating) {
      buffer.appendBuffer(queue.shift());
    }
  });
  buffer.addEventListener('sourceopen', (event) => {
    sourceBufferLogger.info('sourceopen');
  });
  buffer.addEventListener('sourceended', (event) => {
    sourceBufferLogger.info('sourceended');
  });
  buffer.addEventListener('sourceclose', (event) => {
    sourceBufferLogger.info('sourceclose');
  });
  /*
  buffer.addEventListener('updatestart', (event) => {
    sourceBufferLogger.info('updatestart');
  });
  buffer.addEventListener('update', (event) => {
    sourceBufferLogger.info('update');
  });
  buffer.addEventListener('updateend', (event) => {
    sourceBufferLogger.info('updateend');
  });
  */
  buffer.addEventListener('error', (event) => {
    sourceBufferLogger.info('error');
  });
  buffer.addEventListener('abort', (event) => {
    sourceBufferLogger.info('abort');
  });
  buffer.addEventListener('addsourcebuffer', (event) => {
    sourceBufferLogger.info('addsourcebuffer');
  });
  buffer.addEventListener('removesourcebuffer', (event) => {
    sourceBufferLogger.info('removesourcebuffer');
  });
  client.on('initSegment', (data) => {
    buffer.appendBuffer(data);
  });
  client.on('caption', (text) => {
    console.log('caption', text);
  });
  client.on('data', (data) => {
    if (queue.length > 0 || buffer.updating) {
      queue.push(data);
    } else {
      buffer.appendBuffer(data);
    }
  });
  client.on('error', (error) => {
    websocketLogger(error);
  });
  await client.open(address);
}

initialize();


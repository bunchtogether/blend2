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
const videoBufferLogger = makeLogger('Video Source Buffer');
const audioBufferLogger = makeLogger('Audio Source Buffer');
const websocketLogger = makeLogger('WebSocket');

window.addEventListener('unhandledrejection', (event:Event) => {
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

window.addEventListener('error', (event:Event) => {
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

element.addEventListener('resize', (event:Event) => {
  videoLogger.info('abort', 'Sent when playback is aborted; for example, if the media is playing and is restarted from the beginning, this event is sent');
});
element.addEventListener('canplay', (event:Event) => {
  videoLogger.info('canplay', 'Sent when enough data is available that the media can be played, at least for a couple of frames.  This corresponds to the HAVE_ENOUGH_DATA readyState');
});
element.addEventListener('canplaythrough', (event:Event) => {
  videoLogger.info('canplaythrough', 'Sent when the ready state changes to CAN_PLAY_THROUGH, indicating that the entire media can be played without interruption, assuming the download rate remains at least at the current level. It will also be fired when playback is toggled between paused and playing. Note: Manually setting the currentTime will eventually fire a canplaythrough event in firefox. Other browsers might not fire this event');
});
element.addEventListener('durationchange', (event:Event) => {
  videoLogger.info('durationchange', 'The metadata has loaded or changed, indicating a change in duration of the media.  This is sent, for example, when the media has loaded enough that the duration is known');
});
element.addEventListener('emptied', (event:Event) => {
  videoLogger.info('emptied', 'The media has become empty; for example, this event is sent if the media has already been loaded (or partially loaded), and the load() method is called to reload it');
});
element.addEventListener('encrypted', (event:Event) => {
  videoLogger.info('encrypted', ' The user agent has encountered initialization data in the media data');
});
element.addEventListener('ended', (event:Event) => {
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
element.addEventListener('interruptbegin', (event:Event) => {
  videoLogger.info('interruptbegin', 'Sent when audio playing on a Firefox OS device is interrupted, either because the app playing the audio is sent to the background, or audio in a higher priority audio channel begins to play. See Using the AudioChannels API for more details');
});
element.addEventListener('interruptend', (event:Event) => {
  videoLogger.info('interruptend', 'Sent when previously interrupted audio on a Firefox OS device commences playing again — when the interruption ends. This is when the associated app comes back to the foreground, or when the higher priority audio finished playing. See Using the AudioChannels API for more details');
});
element.addEventListener('loadeddata', (event:Event) => {
  videoLogger.info('loadeddata', 'The first frame of the media has finished loading');
});
element.addEventListener('loadedmetadata', (event:Event) => {
  videoLogger.info('loadedmetadata', 'The media\'s metadata has finished loading; all attributes now contain as much useful information as they\'re going to');
});
element.addEventListener('loadstart', (event:ProgressEvent) => {
  videoLogger.info('loadstart', 'Sent when loading of the media begins');
});
element.addEventListener('mozaudioavailable', (event:Event) => {
  videoLogger.info('mozaudioavailable', 'Sent when an audio videoBuffer is provided to the audio layer for processing; the videoBuffer contains raw audio samples that may or may not already have been played by the time you receive the event');
});
element.addEventListener('pause', (event:Event) => {
  videoLogger.info('pause', 'Sent when the playback state is changed to paused (paused property is true)');
});
element.addEventListener('play', (event:Event) => {
  videoLogger.info('play', 'Sent when the playback state is no longer paused, as a result of the play method, or the autoplay attribute');
});
element.addEventListener('playing', (event:Event) => {
  videoLogger.info('playing', 'Sent when the media has enough data to start playing, after the play event, but also when recovering from being stalled, when looping media restarts, and after seeked, if it was playing before seeking');
});
element.addEventListener('ratechange', (event:Event) => {
  videoLogger.info('ratechange', 'Sent when the playback speed changes');
});
element.addEventListener('seeked', (event:Event) => {
  videoLogger.info('seeked', 'Sent when a seek operation completes');
});
element.addEventListener('seeking', (event:Event) => {
  videoLogger.info('seeking', 'Sent when a seek operation begins');
});
element.addEventListener('stalled', (event:Event) => {
  videoLogger.info('stalled', 'Sent when the user agent is trying to fetch media data, but data is unexpectedly not forthcoming');
});
element.addEventListener('suspend', (event:Event) => {
  videoLogger.info('suspend', 'Sent when loading of the media is suspended; this may happen either because the download has completed or because it has been paused for any other reason');
});
element.addEventListener('volumechange', (event:Event) => {
  videoLogger.info('volumechange', 'Sent when the audio volume changes (both when the volume is set and when the muted attribute is changed)');
});
element.addEventListener('waiting', (event:Event) => {
  videoLogger.info('waiting', 'Sent when the requested operation (such as playback) is delayed pending the completion of another operation (such as a seek)');
});

const logevent:EventListener = function (event:Event) {
  console.log(event.type);
};

const route = new Route('/api/1.0/stream/:streamUrl/');
const parsedRoute = route.match(window.location.pathname);

async function initialize() {
  const address = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:${window.location.port}${window.location.pathname}`;
  const client = new Client();
  const mediaSource = new MediaSource();
  mediaSource.addEventListener('sourceopen', (event:Event) => {
    mediaSourceLogger.info('sourceopen');
  });
  mediaSource.addEventListener('sourceended', (event:Event) => {
    mediaSourceLogger.info('sourceended');
  });
  mediaSource.addEventListener('sourceclose', (event:Event) => {
    mediaSourceLogger.info('sourceclose');
  });
  mediaSource.addEventListener('updatestart', (event:Event) => {
    mediaSourceLogger.info('updatestart');
  });
  mediaSource.addEventListener('update', (event:Event) => {
    mediaSourceLogger.info('update');
  });
  mediaSource.addEventListener('updateend', (event:Event) => {
    mediaSourceLogger.info('updateend');
  });
  mediaSource.addEventListener('error', (event:Event) => {
    mediaSourceLogger.info('error');
  });
  mediaSource.addEventListener('abort', (event:Event) => {
    mediaSourceLogger.info('abort');
  });
  mediaSource.addEventListener('addsourcevideoBuffer', (event:Event) => {
    mediaSourceLogger.info('addsourcevideoBuffer');
  });
  mediaSource.addEventListener('removesourcevideoBuffer', (event:Event) => {
    mediaSourceLogger.info('removesourcevideoBuffer');
  });
  element.src = URL.createObjectURL(mediaSource);
  await new Promise((resolve) => {
    const handle = () => {
      mediaSource.removeEventListener('sourceopen', handle);
      resolve();
    };
    mediaSource.addEventListener('sourceopen', handle);
  });
  const videoQueue = [];
  const videoBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.64001f"');
  videoBuffer.addEventListener('updateend', async () => {
    if (videoQueue.length > 0 && !videoBuffer.updating) {
      videoBuffer.appendBuffer(videoQueue.shift());
    }
  });
  videoBuffer.addEventListener('sourceopen', (event:Event) => {
    videoBufferLogger.info('sourceopen');
  });
  videoBuffer.addEventListener('sourceended', (event:Event) => {
    videoBufferLogger.info('sourceended');
  });
  videoBuffer.addEventListener('sourceclose', (event:Event) => {
    videoBufferLogger.info('sourceclose');
  });
  videoBuffer.addEventListener('error', (event:Event) => {
    videoBufferLogger.info('error');
  });
  videoBuffer.addEventListener('abort', (event:Event) => {
    videoBufferLogger.info('abort');
  });
  videoBuffer.addEventListener('addsourcevideoBuffer', (event:Event) => {
    videoBufferLogger.info('addsourcevideoBuffer');
  });
  videoBuffer.addEventListener('removesourcevideoBuffer', (event:Event) => {
    videoBufferLogger.info('removesourcevideoBuffer');
  });
  const audioQueue = [];
  // const audioBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="mp4a.40.5"');
  const audioBuffer = mediaSource.addSourceBuffer('audio/aac');
  audioBuffer.addEventListener('updateend', async () => {
    if (audioQueue.length > 0 && !audioBuffer.updating) {
      audioBuffer.appendBuffer(audioQueue.shift());
    }
  });
  audioBuffer.addEventListener('sourceopen', (event:Event) => {
    audioBufferLogger.info('sourceopen');
  });
  audioBuffer.addEventListener('sourceended', (event:Event) => {
    audioBufferLogger.info('sourceended');
  });
  audioBuffer.addEventListener('sourceclose', (event:Event) => {
    audioBufferLogger.info('sourceclose');
  });
  audioBuffer.addEventListener('error', (event:Event) => {
    audioBufferLogger.info('error');
  });
  audioBuffer.addEventListener('abort', (event:Event) => {
    audioBufferLogger.info('abort');
  });
  audioBuffer.addEventListener('addsourcebuffer', (event:Event) => {
    audioBufferLogger.info('addsourcebuffer');
  });
  audioBuffer.addEventListener('removesourcebuffer', (event:Event) => {
    audioBufferLogger.info('removesourcebuffer');
  });
  let nextBufferedSegmentInterval;
//  const skipToNextBufferedSegment = () => {
//    for (let i = 0; i < videoBuffer.videoBuffered.length; i += 1) {
//      const segmentStart = videoBuffer.videoBuffered.start(i);
//      if (segmentStart > element.currentTime) {
//        element.currentTime = segmentStart;
//        console.log(`JUMP TO ${segmentStart}`);
//        return;
//      }
//    }
//  };
  element.addEventListener('waiting', (event:Event) => {
    console.log(element.currentTime);
    for (let i = 0; i < videoBuffer.buffered.length; i += 1) {
      console.log(videoBuffer.buffered.start(i), videoBuffer.buffered.end(i));
    }
//    clearInterval(nextBufferedSegmentInterval);
//    nextBufferedSegmentInterval = setInterval(() => {
//      skipToNextBufferedSegment();
//    }, 100);
//    skipToNextBufferedSegment();
  });
  element.addEventListener('canplay', (event:Event) => {
    clearInterval(nextBufferedSegmentInterval);
    element.play();
  });
  client.on('video', (data) => {
    if (videoQueue.length > 0 || videoBuffer.updating) {
      videoQueue.push(data);
    } else {
      videoBuffer.appendBuffer(data);
    }
  });
  client.on('audio', (data) => {
    if (audioQueue.length > 0 || audioBuffer.updating) {
      audioQueue.push(data);
    } else {
      audioBuffer.appendBuffer(data);
    }
  });
  client.on('error', (error) => {
    websocketLogger(error);
  });
  await client.open(address);
}

initialize();


// @flow

import { EventEmitter } from 'events';
import WebSocket  from 'isomorphic-ws';
import superagent from 'superagent';
import blendServerDetectedPromise from './server-detection';
import makeBlendLogger from './logger';

/**
 * Class representing a Blend Client
 */
export default class BlendClient extends EventEmitter {

  constructor(element: HTMLVideoElement, streamUrl:string) {
    super();
    this.videoLogger = makeBlendLogger(`${streamUrl} Video Element`);
    this.mediaSourceLogger = makeBlendLogger(`${streamUrl} Media Source`);
    this.videoBufferLogger = makeBlendLogger(`${streamUrl} Video Source Buffer`);
    this.audioBufferLogger = makeBlendLogger(`${streamUrl} Audio Source Buffer`);
    this.webSocketLogger = makeBlendLogger(`${streamUrl} WebSocket`);
    this.setupElementLogging(element);
    this.openWebSocket(streamUrl);
    this.setupMediaSource(element);
    this.videoQueue = [];
    this.audioQueue = [];
  }

  /**
   * Connects to a server.
   * @param {string} address Stream URL
   * @return {Promise<void>}
   */
  async openWebSocket(streamUrl:string) {

    const address = `ws://127.0.0.1:61340/api/1.0/stream/${encodeURIComponent(streamUrl)}/`;
    
    const blendServerDetected = await blendServerDetectedPromise;

    if(!blendServerDetected) {
      this.webSocketLogger.error(`Unable to open web socket connection to ${address}, Blend Server not detected`);
      return;
    }

    const ws = new WebSocket(address);

    let heartbeatInterval;

    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      this.emit('open');
      this.ws = ws;
      heartbeatInterval = setInterval(() => {
        if (ws.readyState === 1) {
          ws.send(new Uint8Array([]));
        }
      }, 5000);
    };

    ws.onclose = (event) => {
      clearInterval(heartbeatInterval);
      const { wasClean, reason, code } = event;
      console.log(`${wasClean ? 'Cleanly' : 'Uncleanly'} closed websocket connection to ${address} with code ${code}${reason ? `: ${reason}` : ''}`);
      delete this.ws;
      this.emit('close', code, reason);
    };

    ws.onmessage = (event) => {
      const typedArray = new Uint8Array(event.data);
      const data = typedArray.slice(1);
      const messageType = typedArray[0];
      if(messageType === 0) {
        const audioBuffer = this.audioBuffer;
        const audioQueue = this.audioQueue;
        if(audioBuffer) {
          if (audioQueue.length > 0 || audioBuffer.updating) {
            audioQueue.push(data);
          } else {
            audioBuffer.appendBuffer(data);
          }
        } else {
          audioQueue.push(data);
        }
      } else if(messageType === 1) {
        const videoBuffer = this.videoBuffer;
        const videoQueue = this.videoQueue;
        if(videoBuffer) {
          if (videoQueue.length > 0 || videoBuffer.updating) {
            videoQueue.push(data);
          } else {
            videoBuffer.appendBuffer(data);
          }
        } else {
          videoQueue.push(data);
        }
      }
    };

    ws.onerror = (event) => {
      console.log(event);
      this.emit('error', event);
    };

  }

  /**
   * Close connection to server.
   * @param {number} [code] Websocket close reason code to send to the server
   * @param {string} [reason] Websocket close reason to send to the server
   * @return {Promise<void>}
   */
  async closeWebSocket(code?: number, reason?: string) {
    if (!this.ws) {
      return;
    }
    await new Promise((resolve, reject) => {
      const onClose = () => {
        this.removeListener('error', onError);
        resolve();
      };
      const onError = (event: Event) => {
        this.removeListener('close', onClose);
        reject(event);
      };
      this.once('error', onError);
      this.once('close', onClose);
      this.ws.close(code, reason);
    });
  }

  async setupMediaSource(element: HTMLVideoElement) {
    const mediaSource = new MediaSource();
    this.setupMediaSourceLogging(mediaSource);
    element.src = URL.createObjectURL(mediaSource);
    await new Promise((resolve) => {
      const handle = () => {
        mediaSource.removeEventListener('sourceopen', handle);
        resolve();
      };
      mediaSource.addEventListener('sourceopen', handle);
    });
    const videoBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.64001f"');
    this.videoBuffer = videoBuffer;
    this.setupVideoBufferLogging(videoBuffer);
    videoBuffer.addEventListener('updateend', async () => {
      if (this.videoQueue.length > 0 && !videoBuffer.updating) {
        videoBuffer.appendBuffer(this.videoQueue.shift());
      }
    });
    const audioBuffer = mediaSource.addSourceBuffer('audio/aac');
    this.audioBuffer = audioBuffer;
    this.setupAudioBufferLogging(audioBuffer);
    audioBuffer.addEventListener('updateend', async () => {
      if (this.audioQueue.length > 0 && !audioBuffer.updating) {
        audioBuffer.appendBuffer(this.audioQueue.shift());
      }
    });
    if (this.videoQueue.length > 0 && !videoBuffer.updating) {
      videoBuffer.appendBuffer(this.videoQueue.shift());
    }
    if (this.audioQueue.length > 0 && !audioBuffer.updating) {
      audioBuffer.appendBuffer(this.audioQueue.shift());
    }
    let nextBufferedSegmentInterval;
    const skipToNextBufferedSegment = () => {
      for (let i = 0; i < videoBuffer.buffered.length; i += 1) {
        const segmentStart = videoBuffer.buffered.start(i);
        if (segmentStart > element.currentTime) {
          this.videoLogger.warn(`Skipping ${segmentStart - element.currentTime} ms`);
          element.currentTime = segmentStart;
          return;
        }
      }
    };
    element.addEventListener('waiting', (event:Event) => {
      clearInterval(nextBufferedSegmentInterval);
      nextBufferedSegmentInterval = setInterval(() => {
        skipToNextBufferedSegment();
      }, 100);
      skipToNextBufferedSegment();
    });
    element.addEventListener('canplay', (event:Event) => {
      clearInterval(nextBufferedSegmentInterval);
      element.play();
    });
  }

  setupMediaSourceLogging(mediaSource: MediaSource) {
    const mediaSourceLogger = this.mediaSourceLogger;
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
  }

  setupVideoBufferLogging(videoBuffer: SourceBuffer) {
    const videoBufferLogger = this.videoBufferLogger;
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
  }

  setupAudioBufferLogging(audioBuffer: SourceBuffer) {
    const audioBufferLogger = this.audioBufferLogger;
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
  }

  setupElementLogging(element: HTMLVideoElement) {
    const videoLogger = this.videoLogger;
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
  }

  id:string;
  address:string;
  ws: WebSocket;
  ready: Promise<void>;
  videoLogger: Object;
  mediaSourceLogger: Object;
  videoBufferLogger: Object;
  audioBufferLogger: Object;
  webSocketLogger: Object;
  videoQueue:Array<Uint8Array>;
  audioQueue:Array<Uint8Array>;
}


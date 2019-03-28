// @flow

/* eslint-disable no-unused-vars */

import { BlendClient, blendServerDetectedPromise, makeBlendLogger, getBlendThumbnailUrl } from '@bunchtogether/blend2-client';

const windowLogger = makeBlendLogger('Window');

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

const urlRegex = /\/api\/1\.0\/stream\/([^/]+)\//;

async function initialize() {
  const urlMatch = window.location.href.match(urlRegex);
  if (!urlMatch || !urlMatch[1]) {
    throw new Error(`Invalid address ${window.location.href}`);
  }
  const streamUrl = decodeURIComponent(urlMatch[1]);

  const blendServerDetected = await blendServerDetectedPromise;

  if (blendServerDetected) {
    windowLogger.info('Blend server detected');
  } else {
    windowLogger.error(`Unable to open web socket connection for ${streamUrl}, Blend Server not detected`);
    return;
  }

  const thumbnailUrl = await getBlendThumbnailUrl(streamUrl);

  windowLogger.info(`Thumbnail: ${thumbnailUrl}`);

  const element = document.querySelector('video');
  if (!element) {
    throw new Error('Video element does not exist');
  }
  const client = new BlendClient(element, streamUrl);
}

initialize();


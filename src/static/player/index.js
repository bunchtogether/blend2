// @flow

/* eslint-disable no-unused-vars */


import Route from 'route-parser';
import Client from '../../client';
import makeLogger from '../../client/logger';

const windowLogger = makeLogger('Window');

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

async function initialize() {
  const element = document.querySelector('video');
  if (!element) {
    throw new Error('Video element does not exist');
  }
  const address = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:${window.location.port}${window.location.pathname}`;
  const client = new Client(element, address);
}

initialize();


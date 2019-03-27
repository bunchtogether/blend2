// @flow

const { EventEmitter } = require('events');
const WebSocket = require('isomorphic-ws');
const muxjs = require('mux.js');

/**
 * Class representing a Blend Client
 */
class Client extends EventEmitter {
//  /**
//   * Create a Blend Client.
//   */
  constructor() {
    super();
    this.transmuxer = new muxjs.mp4.Transmuxer();
    let initSegment;
    this.transmuxer.on('data', (event) => {
      if (event.initSegment && !initSegment) {
        initSegment = new Uint8Array(event.initSegment);
        const merged = new Uint8Array(initSegment.length + event.data.length);
        merged.set(initSegment);
        merged.set(event.data, initSegment.length);
        this.emit('initSegment', initSegment);
      }
      if (event.data) {
        this.emit('data', event.data);
      }
      event.captions.forEach((cue) => {
        this.emit('caption', cue.text);
      });
    });
  }

  /**
   * Connects to a server.
   * @param {string} address Websocket URL of the server
   * @return {Promise<void>}
   */
  async open(address:string) {
    this.address = address;

    const ws = new WebSocket(address);

    let heartbeatInterval;

    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      this.emit('open');
      this.ws = ws;
      heartbeatInterval = setInterval(() => {
        ws.send(new Uint8Array([]));
      }, 5000);
    };

    ws.onclose = (event) => {
      clearInterval(heartbeatInterval);
      const { wasClean, reason, code } = event;
      console.log(`${wasClean ? 'Cleanly' : 'Uncleanly'} closed websocket connection to ${this.address} with code ${code}${reason ? `: ${reason}` : ''}`);
      delete this.ws;
      this.emit('close', code, reason);
    };

    let started;
    ws.onmessage = (event) => {
      const typedArray = new Uint8Array(event.data);
      this.transmuxer.push(typedArray);
      if (!started) {
        started = true;
        setTimeout(() => {
          setInterval(() => {
            this.transmuxer.flush();
          }, 1000);
        }, 1000);
      }
    };

    ws.onerror = (event) => {
      console.log(event);
      this.emit('error', event);
    };

    await new Promise((resolve, reject) => {
      const onOpen = () => {
        this.removeListener('error', onError);
        resolve();
      };
      const onError = (event: Event) => {
        this.removeListener('open', onOpen);
        reject(event);
      };
      this.once('error', onError);
      this.once('open', onOpen);
    });
  }

  /**
   * Close connection to server.
   * @param {number} [code] Websocket close reason code to send to the server
   * @param {string} [reason] Websocket close reason to send to the server
   * @return {Promise<void>}
   */
  async close(code?: number, reason?: string) {
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

  id:string;
  address:string;
  ws: WebSocket;
  transmuxer: Object;
}

module.exports = Client;

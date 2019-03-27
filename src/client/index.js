// @flow

const { EventEmitter } = require('events');
const WebSocket = require('isomorphic-ws');


/**
 * Class representing a Blend Client
 */
class Client extends EventEmitter {
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
        if (ws.readyState === 1) {
          ws.send(new Uint8Array([]));
        }
      }, 5000);
    };

    ws.onclose = (event) => {
      clearInterval(heartbeatInterval);
      const { wasClean, reason, code } = event;
      console.log(`${wasClean ? 'Cleanly' : 'Uncleanly'} closed websocket connection to ${this.address} with code ${code}${reason ? `: ${reason}` : ''}`);
      delete this.ws;
      this.emit('close', code, reason);
    };

    ws.onmessage = (event) => {
      const typedArray = new Uint8Array(event.data);
      if(typedArray[0] === 0) {
        this.emit('audio', typedArray.slice(1));
      }
      if(typedArray[0] === 1) {
        this.emit('video', typedArray.slice(1));
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
}

module.exports = Client;

//      

const { EventEmitter } = require('events');
const dgram = require('dgram');
const crypto = require('crypto');
const logger = require('../../lib/logger')('Multicast Assist Receiver');
const RtpPacket = require('./packet');
const RtpControlPacket = require('./control-packet');
const AnnouncePacket = require('./announce-packet');

const ANNOUNCE_INTERVAL = 30000;
const FLUSH_INTERVAL = 5000;
const BUFFER_SIZE = 1024 * 128;

function randomInteger() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

class Receiver extends EventEmitter {
                                      
                              
                                   
                       
                              
                         
                                
                                                         
                                                                                                     
                                            
                                     
                                     
                                    
                                       
                     
                        
                            

  constructor(bindAddress       , multicastAddress       , port        , controlPort        , loopback         ) {
    super();
    this.bindAddress = bindAddress;
    this.multicastAddress = multicastAddress;
    this.port = port;
    this.controlPort = controlPort;
    this.readyPromise = this.init();
    this.ssrcQueue = new Map();
    this.ssrcMetadata = new Map();
    this.ssrcTimeouts = new Map();
    this.peers = new Map();
    this.sortedPeers = [];
    this.flushInterval = setInterval(() => this.flush(), FLUSH_INTERVAL);
    this.started = new Date();
    this.loopback = loopback;
  }

  async announce() {
    if (!this.id) {
      return;
    }
    await new Promise((resolve) => {
      const buffer = new AnnouncePacket(this.id).serialize();
      this.controlSocket.send(buffer, 0, buffer.length, this.controlPort, this.multicastAddress, resolve);
    });
    let updatedPeers = false;
    for (const [peerId, timestamp] of this.peers) {
      if (timestamp < Date.now()) {
        this.peers.delete(peerId);
        updatedPeers = true;
      }
    }
    if (updatedPeers) {
      this.sortedPeers = [this.id, ...this.peers.keys()];
      this.sortedPeers.sort();
    }
  }

  async flush() {
    const ssrcs = new Set([...this.ssrcQueue.keys()]);
    for (const ssrc of ssrcs) {
      const timestamp = this.ssrcTimeouts.get(ssrc);
      if (!timestamp || timestamp < Date.now()) {
        this.ssrcQueue.delete(ssrc);
        this.ssrcMetadata.delete(ssrc);
        this.ssrcTimeouts.delete(ssrc);
        logger.warn(`Clearing expired SSRC ${ssrc}`);
        continue;
      }
    }
  }

  handleSocketMessage(message       ) {
    const packet = RtpPacket.deserialize(message);
    const map = this.ssrcQueue.get(packet.ssrc) || new Map();
    map.set(packet.sequenceNumber, packet);
    this.ssrcQueue.set(packet.ssrc, map);
    this.ssrcTimeouts.set(packet.ssrc, Date.now() + FLUSH_INTERVAL * 2.1);
    const metadata = this.ssrcMetadata.get(packet.ssrc);
    if (metadata && metadata.packetCount === map.size) {
      this.processSsrc(packet.ssrc);
    }
  }

  handleControlSocketMessage(message       ) {
    if (message[1] === 200) {
      const { packetCount, octetCount, ntpTimestamp, ssrc } = RtpControlPacket.deserialize(message);
      this.ssrcMetadata.set(ssrc, { packetCount, octetCount, ntpTimestamp });
    } else if (message[1] === 204) {
      const packet = AnnouncePacket.deserialize(message);
      if (packet.ssrc !== this.id) {
        const newPeer = !this.peers.get(packet.ssrc);
        this.peers.set(packet.ssrc, Date.now() + ANNOUNCE_INTERVAL * 2.1);
        if (newPeer) {
          logger.info(`Discovered multicast peer ${packet.ssrc}`);
          this.sortedPeers = [this.id, ...this.peers.keys()];
          this.sortedPeers.sort();
          this.announce();
        }
      }
    } else {
      logger.error('Unknown control socket message type.');
    }
  }

  async init() {
    this.id = randomInteger();
    this.socket = dgram.createSocket({ type: this.bindAddress.indexOf(':') === -1 ? 'udp4' : 'udp6', reuseAddr: true, sendBufferSize: BUFFER_SIZE, recvBufferSize: BUFFER_SIZE });
    this.socket.on('message', this.handleSocketMessage.bind(this));
    this.socket.on('error', logger.error.bind(logger));
    await new Promise((resolve, reject) => {
      this.socket.once('listening', () => {
        try {
          this.socket.setMulticastLoopback(this.loopback);
          this.socket.setBroadcast(true);
          this.socket.setMulticastTTL(128);
          this.socket.addMembership(this.multicastAddress);
          const address = this.socket.address();
          logger.info(`Listening on ${address.address}:${address.port}, multicast to ${this.multicastAddress}`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.socket.once('error', reject);
      this.socket.bind(this.port, this.bindAddress);
    });
    this.controlSocket = dgram.createSocket({ type: this.bindAddress.indexOf(':') === -1 ? 'udp4' : 'udp6', reuseAddr: true, sendBufferSize: BUFFER_SIZE, recvBufferSize: BUFFER_SIZE });
    this.controlSocket.on('message', this.handleControlSocketMessage.bind(this));
    this.controlSocket.on('error', logger.error.bind(logger));
    await new Promise((resolve, reject) => {
      this.controlSocket.once('listening', () => {
        try {
          this.controlSocket.setMulticastLoopback(this.loopback);
          this.controlSocket.setBroadcast(true);
          this.controlSocket.setMulticastTTL(128);
          this.controlSocket.addMembership(this.multicastAddress);
          const address = this.controlSocket.address();
          logger.info(`Listening (control) on ${address.address}:${address.port}, multicast to ${this.multicastAddress}`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.controlSocket.once('error', reject);
      this.controlSocket.bind(this.controlPort, this.bindAddress);
    });
    await this.announce();
    this.announceInterval = setInterval(() => this.announce(), ANNOUNCE_INTERVAL);
  }

  processSsrc(ssrc        ) {
    const packetMap = this.ssrcQueue.get(ssrc);
    const metadata = this.ssrcMetadata.get(ssrc);
    this.ssrcQueue.delete(ssrc);
    this.ssrcMetadata.delete(ssrc);
    this.ssrcTimeouts.delete(ssrc);
    if (!packetMap || !metadata) {
      return;
    }
    const packets = [...packetMap.values()];
    packets.sort((x, y) => x.sequenceNumber - y.sequenceNumber);
    if (packets.length !== metadata.packetCount) {
      logger.error(`SSRC ${ssrc} received ${packets.length} packets but expected ${metadata.packetCount} packets`);
      return;
    }
    const buffer = Buffer.concat(packets.map((packet) => packet.payload));
    if (buffer.length !== metadata.octetCount) {
      logger.error(`SSRC ${ssrc} received ${buffer.length} bytes but expected ${metadata.octetCount} bytes`);
      return;
    }
    this.emit('data', buffer);
  }

  async shutdown() {
    clearInterval(this.flushInterval);
    clearInterval(this.announceInterval);
    const socketClose = new Promise((resolve, reject) => {
      this.socket.once('error', reject);
      this.socket.once('close', resolve);
      this.socket.close();
    });
    const controlSocketClose = new Promise((resolve, reject) => {
      this.controlSocket.once('error', reject);
      this.controlSocket.once('close', resolve);
      this.controlSocket.close();
    });
    await Promise.all([socketClose, controlSocketClose]);
    logger.info('Shut down');
  }
}

module.exports = Receiver;

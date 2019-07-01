// See https://github.com/1995parham/krtp

class AnnouncePacket {
  constructor(ssrc) {
    this.ssrc = ssrc;
    this.rc = 0;
  }

  serialize() {
    const buff = Buffer.alloc(8 + 0);

    /* header */

    /* buff[0] = (V << 6 | P << 5 | RC) */
    buff[0] = (2 << 6 | 0 << 5 | this.rc);
    /* buff[1] = PT */
    buff[1] = 204;
    /* buff[2, 3] = length */
    buff.writeUInt16BE((buff.length / 4 | 0) - 1, 2);
    /* buff[4, 5, 6, 7] = SSRC  */
    buff.writeUInt32BE(this.ssrc, 4);

    /* sender info */

    // None for now

    return buff;
  }

  static deserialize(buff) {
    /* header */

    /* buff[0] = (V << 6 | P << 5 | RC) */
    if (buff[0] & 0xC0 >> 6 !== 2) {
      return null;
    }
    /* buff[1] = PT */
    if (buff[1] !== 204) {
      return null;
    }
    /* buff[2, 3] = length */
    const length = (buff.readUInt16BE(2) + 1) * 4;
    if (buff.length !== length) {
      return null;
    }
    /* buff[4, 5, 6, 7] = SSRC */
    const ssrc = buff.readUInt32BE(4);

    /* sender info */

    const packet = new AnnouncePacket(ssrc);

    return packet;
  }
}

module.exports = AnnouncePacket;

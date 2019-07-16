// @flow

module.exports.serializeBlendBox = (date:Date, timestamp:number, maxTimestamp:number, hash:number) => {
  const blendBox = Buffer.alloc(40);
  blendBox.set([0x00, 0x00, 0x00, 0x28, 0x73, 0x6B, 0x69, 0x70], 0);
  blendBox.writeDoubleBE(date.getTime(), 8);
  blendBox.writeDoubleBE(timestamp, 16);
  blendBox.writeDoubleBE(maxTimestamp, 24);
  blendBox.writeDoubleBE(hash, 32);
  return blendBox;
};

module.exports.deserializeBlendBox = (buffer:Buffer) => {
  if(buffer[0] !== 0x00 || buffer[1] !== 0x00 || buffer[2] !== 0x00 || buffer[3] !== 0x28 || buffer[4] !== 0x73 || buffer[5] !== 0x6B || buffer[6] !== 0x69 || buffer[7] !== 0x70) {
    throw new Error("Invalid header");
  }
  const date = new Date(buffer.readDoubleBE(8));
  const timestamp = buffer.readDoubleBE(16);
  const maxTimestamp = buffer.readDoubleBE(24);
  const hash = buffer.readDoubleBE(32);
  return [date, timestamp, maxTimestamp, hash];
};

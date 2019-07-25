// @flow

const expect = require('expect');
const Int64 = require('node-int64');
const { serializeBlendBox, deserializeBlendBox } = require('../src/lib/blend-box');

describe('Multicast Assist', () => {
  test('Should serialize and deserialize dates.', () => {
    const date = new Date();
    const x = new Int64(date.getTime());
    const buffer = x.toBuffer();
    const y = new Int64(buffer);
    const date2 = new Date(y.toNumber());
    expect(date).toEqual(date2);
  });
  test('Should serialize and deserialize Blend boxes.', async () => {
    const date = new Date();
    const timestamp = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    const maxTimestamp = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    const hash = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    const buffer = serializeBlendBox(date, timestamp, maxTimestamp, hash);
    const [date2, timestamp2, maxTimestamp2, hash2] = deserializeBlendBox(buffer);
    expect(date).toEqual(date2);
    expect(timestamp).toEqual(timestamp2);
    expect(maxTimestamp).toEqual(maxTimestamp2);
    expect(hash).toEqual(hash2);
  });
});


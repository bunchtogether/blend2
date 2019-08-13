// @flow

const { addStreamUrlParameters } = require('../src/routers/stream');

describe('Stream', () => {
  test('Should discover devices available for pairing.', async () => {
    const url = 'udp://192.168.1.100:4000';
    expect(addStreamUrlParameters(url)).toEqual('udp://192.168.1.100:4000?fifo_size=50000000&overrun_nonfatal=1');
  });
});

// @flow

// const expect = require('expect');
const { isAvailable } = require('../src/bluescape');

describe('Bluescape', () => {
  test('Checks if Bluescape is available.', async () => {
    console.log(await isAvailable());
  });
});


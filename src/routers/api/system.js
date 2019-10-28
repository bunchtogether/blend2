// @flow

const os = require('os');
const { Router } = require('express');
const logger = require('../../lib/logger')('System API');

let setVolume = (volume:number) => { throw new Error('Set volume not implemented'); }; // eslint-disable-line no-unused-vars
let getVolume = () => { throw new Error('Get volume not implemented'); };
let setMuted = (muted:boolean) => { throw new Error('Set muted not implemented'); }; // eslint-disable-line no-unused-vars
let getMuted = () => { throw new Error('Get muted not implemented'); };

const useLoudness = () => {
  const loudness = require('loudness'); // eslint-disable-line global-require,import/no-extraneous-dependencies,import/no-unresolved
  setVolume = (volume: number) => loudness.setVolume(volume * 100);
  getVolume = async () => {
    const volume = await loudness.getVolume();
    return volume / 100;
  };
  setMuted = (muted: boolean) => loudness.setMuted(muted);
  getMuted = () => loudness.getMuted();
};

const useWinAudio = () => {
  const { volume: winAudio } = require('node-audio-windows'); // eslint-disable-line global-require,import/no-extraneous-dependencies,import/no-unresolved
  setVolume = (volume: number) => winAudio.setVolume(volume);
  getVolume = () => winAudio.getVolume();
  setMuted = (muted: boolean) => winAudio.setMute(muted);
  getMuted = () => winAudio.isMuted();
};

switch (os.platform()) {
  case 'linux':
  case 'darwin':
    useLoudness();
    break;
  case 'win32':
    useWinAudio();
    break;
  default:
    throw new Error(`Unsupported platform: ${os.platform()}`);
}

module.exports.getSystemRouter = () => {
  logger.info('Attaching system router');

  const router = Router({ mergeParams: true });

  router.post('/muted', async (req: express$Request, res: express$Response) => {
    const { body: { muted } } = req;

    if (typeof muted !== 'boolean') {
      res.status(400).send('Missing required body parameter "muted"');
      return;
    }

    try {
      await setMuted(muted);
      res.status(200).send({ muted });
    } catch (error) {
      logger.error('Error setting muted');
      logger.errorStack(error);
      res.status(400).send('Error setting muted');
    }
  });

  router.get('/muted', async (req: express$Request, res: express$Response) => {
    try {
      const muted = await getMuted();
      res.status(200).send({ muted });
    } catch (error) {
      logger.error('Error getting muted');
      logger.errorStack(error);
      res.status(400).send('Error setting muted');
    }
  });

  router.post('/volume', async (req: express$Request, res: express$Response) => {
    const { body: { volume } } = req;

    if (typeof volume !== 'number') {
      res.status(400).send('Missing required body parameter "volume"');
      return;
    }

    if (volume < 0 || volume > 1) {
      res.status(400).send('Body parameter "volume" should be between 0 and 1');
      return;
    }

    try {
      await setVolume(volume);
      res.status(200).send({ volume });
    } catch (error) {
      logger.error('Error getting volume');
      logger.errorStack(error);
      res.status(400).send('Error getting volume');
    }
  });

  router.get('/volume', async (req: express$Request, res: express$Response) => {
    try {
      const volume = await getVolume();
      res.status(200).send({ volume });
    } catch (error) {
      logger.error('Error setting volume');
      logger.errorStack(error);
      res.status(400).send('Error setting volume');
    }
  });


  return router;
};

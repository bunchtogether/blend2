// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { BlendClient, getIsServerAvailable, makeBlendLogger, getBlendThumbnailUrl } from '@bunchtogether/blend2-client';

const styles = () => ({
  container: {
    overflow: 'hidden',
    maxHeight: '100%',
  },
  video: {
    background: '#222',
    '--width': '100%',
    width: 'var(--width)',
    height: 'calc(var(--width) * 0.5625)',
  },
});

type Props = {
  classes: ClassesType,
};

class Player extends React.PureComponent<Props> {
  componentDidMount() {
    const windowLogger = makeBlendLogger('Window');

    window.addEventListener('unhandledrejection', (event:Object) => {
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

    window.addEventListener('error', (event:Object) => {
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

    const urlRegex = /\/stream\/(.*)/;

    async function initialize() {
      const urlMatch = window.location.href.match(urlRegex);
      if (!urlMatch || !urlMatch[1]) {
        throw new Error(`Invalid address ${window.location.href}`);
      }

      const streamUrl = decodeURIComponent(urlMatch[1][urlMatch[1].length - 1] === '/' ? urlMatch[1].slice(0, urlMatch[1].length - 1) : urlMatch[1]);

      const blendServerDetected = await getIsServerAvailable();

      if (blendServerDetected) {
        windowLogger.info('Blend server detected');
      } else {
        windowLogger.error(`Unable to open web socket connection for ${streamUrl}, Blend Server not detected`);
        return;
      }

      const thumbnailUrl = await getBlendThumbnailUrl(streamUrl);

      windowLogger.info(`Thumbnail: ${thumbnailUrl}`);

      const element = document.querySelector('video');
      if (!element) {
        throw new Error('Video element does not exist');
      }
      const client = new BlendClient(element, streamUrl);
      client.on('error', () => {
        windowLogger.error('Uncaught blend error');
      });
    }

    initialize();
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.container}>
        <video
          className={classes.video}
          id="video"
          playsInline
          muted
          controls
          autoPlay
        />
      </div>
    );
  }
}

export default withStyles(styles)(Player);

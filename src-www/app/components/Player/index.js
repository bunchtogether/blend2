// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { BlendClient, getIsServerAvailable, makeBlendLogger, getBlendThumbnailUrl } from '@bunchtogether/blend2-client';

const styles = () => ({
  container: {
    overflow: 'auto',
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
  location: Object,
};

const windowLogger = makeBlendLogger('Window');
const unhandledRejectionHandler = (event:Object) => {
  if (event.promise) {
    event.promise.catch((error) => {
      if (error.stack) {
        windowLogger.error(error.stack);
      } else if (error.message) {
        windowLogger.error(error.message);
      } else {
        windowLogger.error('Unhandled rejection');
        console.log(event);
      }
    });
    return;
  }
  if (event && event.error) {
    if (event.error.stack) {
      windowLogger.error(event.error.stack);
    } else if (event.error.message) {
      windowLogger.error(event.error.message);
    } else {
      windowLogger.error('Unhandled rejection');
    }
  } else if (event.message) {
    windowLogger.error(event.message);
  } else {
    windowLogger.error('Unhandled rejection');
    console.log(event);
  }
};

const errorHandler = (event:Object) => {
  if (event && event.error) {
    if (event.error.stack) {
      windowLogger.error(event.error.stack);
    } else if (event.error.message) {
      windowLogger.error(event.error.message);
    } else {
      windowLogger.error('Uncaught error');
    }
  } else if (event.message) {
    windowLogger.error(event.message);
  } else {
    windowLogger.error('Uncaught error');
    console.log(event);
  }
};
const urlRegex = /\/stream\/(.*)/;

class Player extends React.PureComponent<Props> {
  componentDidMount() {
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    window.addEventListener('error', errorHandler);
    this.initialize();
  }

  componentDidUpdate(prevProps: Object) {
    const currentPath = this.props.location ? this.props.location.pathname : null;
    const previousPath = prevProps.location ? prevProps.location.pathname : null;
    if (currentPath && currentPath !== previousPath) {
      this.initialize();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    window.removeEventListener('error', errorHandler);
  }

  async initialize() {
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

  render() {
    const { classes } = this.props;
    console.log(this.props);
    return (
      <div className={classes.container}>
        <video
          className={classes.video}
          id='video'
          playsInline
          muted
          controls
          autoPlay
        />
      </div>
    );
  }
}

export default compose(
  withStyles(styles),
  withRouter,
)(Player);

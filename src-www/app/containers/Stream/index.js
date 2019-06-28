// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { compose, bindActionCreators } from 'redux';
import { navigateStream } from 'containers/App/actions';
import Navigation from 'components/Navigation';
import Content from 'components/Content';
import Header from 'components/Header';
import Player from 'components/Player';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  streamUrlContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignIntems: 'center',
    justifyContent: 'flex-start',
  },
  streamUrl: {
    minWidth: 400,
    margin: theme.spacing(2),
  },
  playButton: {
    alignSelf: 'center',
  },
});

type Props = {
  classes: Object,
  match: Object,
  navigateStream: Function,
};

type State = {
  streamUrl: string,
};

export class Stream extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  state = {
    streamUrl: '',
  };

  render() {
    const { classes, match: { params: { url } } } = this.props;
    const { streamUrl } = this.state;
    if (url) {
      return <Player />;
    }
    return (
      <React.Fragment>
        <Helmet>
          <title>Blend</title>
        </Helmet>
        <Header showSearch={false} />
        <Navigation />
        <Content>
          <div className={classes.container}>
            <div className={classes.streamUrlContainer}>
              <TextField
                className={classes.streamUrl}
                label='Stream URL'
                value={streamUrl}
                onChange={(event) => this.setState({ streamUrl: event.target.value })}
              />
              <Button
                className={classes.playButton}
                variant='contained'
                color='primary'
                disabled={!streamUrl}
                onClick={() => this.props.navigateStream(streamUrl)}
              >
                Play
              </Button>
            </div>
            <Typography>
              Or try a <a href="/stream/rtp%3A%2F%2F127.0.0.1%3A13337">test stream</a>
            </Typography>
          </div>
        </Content>
      </React.Fragment>
    );
  }
}

const withConnect = connect(null, (dispatch: Function): Object => bindActionCreators({ navigateStream }, dispatch));

export default compose(
  withStyles(styles, { withTheme: true }),
  withConnect,
)(Stream);

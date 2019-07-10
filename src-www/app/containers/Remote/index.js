// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { compose, bindActionCreators } from 'redux';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import Navigation from 'components/Navigation';
import Content from 'components/Content';
import Header from 'components/Header';
import RemotePower from 'components/RemotePower';
import RemoteMute from 'components/RemoteMute';
import RemoteVolume from 'components/RemoteVolume';
import RemoteSource from 'components/RemoteSource';
import Progress from 'components/Progress';
import { pairedDeviceSelector, deviceLoadedSelector, remoteErrorSelector } from 'containers/App/selectors';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
    paddingTop: theme.spacing(4),
  },
  message: {
    marginBottom: theme.spacing(4),
    marginRight: theme.spacing(4),
    marginLeft: theme.spacing(4),
  },
  progress: {
    marginBottom: theme.spacing(4),
    marginRight: theme.spacing(4),
    marginLeft: theme.spacing(4),
  },
  error: {
    color: theme.palette.error[500],
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(4),
  },
});

type Props = {
  classes: ClassesType,
  pairedDevice: Object,
  deviceLoaded: boolean,
  remoteError: string,
};

type State = {
};

export class Stream extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  renderContent() {
    const { classes, pairedDevice, remoteError } = this.props;
    return (
      <div className={classes.container}>
        {!pairedDevice ? (
          <div className={classes.message}>
            <Typography>No paired displays found.</Typography>
            <Typography>You can pair a display from the settings.</Typography>
          </div>
        ) : (
          <React.Fragment>
            <RemotePower />
            <RemoteMute />
            <RemoteVolume />
            <RemoteSource />
          </React.Fragment>
        )}
        {remoteError ? (
          <Typography className={classes.error}>{remoteError}</Typography>
        ) : null}
      </div>
    );
  }
  render() {
    const { classes, deviceLoaded } = this.props;
    return (
      <React.Fragment>
        <Helmet>
          <title>Blend</title>
        </Helmet>
        <Header showSearch={false} />
        <Navigation />
        <Content card>
          <Card>
            {deviceLoaded ? this.renderContent() : <Progress className={classes.progress} />}
          </Card>
        </Content>
      </React.Fragment>
    );
  }
}

const withConnect = connect((state: StateType) => ({
  pairedDevice: pairedDeviceSelector(state),
  deviceLoaded: deviceLoadedSelector(state),
  remoteError: remoteErrorSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ }, dispatch));

export default compose(
  withStyles(styles, { withTheme: true }),
  withConnect,
)(Stream);

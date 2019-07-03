// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { compose, bindActionCreators } from 'redux';
import Typography from '@material-ui/core/Typography';
import Navigation from 'components/Navigation';
import Content from 'components/Content';
import Header from 'components/Header';
import RemotePower from 'components/RemotePower';
import RemoteVolume from 'components/RemoteVolume';
import RemoteSource from 'components/RemoteSource';
import Progress from 'components/Progress';
import { pairedDeviceSelector, deviceLoadedSelector } from 'containers/App/selectors';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
    paddingTop: theme.spacing(8),
  },
});

type Props = {
  classes: ClassesType,
  pairedDevice: Object,
  deviceLoaded: boolean,
};

type State = {
};

export class Stream extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  renderContent() {
    const { classes, pairedDevice } = this.props;
    return (
      <div className={classes.container}>
        {!pairedDevice ? (
          <React.Fragment>
            <Typography>No paired displays found.</Typography>
            <Typography>You can pair a display from the settings.</Typography>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <RemotePower />
            <RemoteVolume />
            <RemoteSource />
          </React.Fragment>
        )}
      </div>
    );
  }
  render() {
    const { deviceLoaded } = this.props;
    return (
      <React.Fragment>
        <Helmet>
          <title>Blend</title>
        </Helmet>
        <Header showSearch={false} />
        <Navigation />
        <Content>
          {deviceLoaded ? this.renderContent() : <Progress />}
        </Content>
      </React.Fragment>
    );
  }
}

const withConnect = connect((state: StateType) => ({
  pairedDevice: pairedDeviceSelector(state),
  deviceLoaded: deviceLoadedSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ }, dispatch));

export default compose(
  withStyles(styles, { withTheme: true }),
  withConnect,
)(Stream);

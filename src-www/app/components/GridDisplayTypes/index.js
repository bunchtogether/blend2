// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Progress from 'components/Progress';
import GridItemDisplayType from 'components/GridItemDisplayType';
import { discoverDevices } from 'containers/App/actions';
import { pairDiscoverSelector, pairedDeviceSelector } from 'containers/App/selectors';
import { TYPE_VIZIO, DISPLAYS, PORT_NAMES, DISPLAY_NAMES } from '../../constants';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
  },
  subtitle: {
    marginBottom: theme.spacing(2),
  },
  button: {
    marginTop: theme.spacing(1),
  },
  backButton: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(11),
  },
  autoDetect: {
    marginBottom: theme.spacing(2),
  },
  success: {
    color: theme.palette.success[500],
  },
});

type Props = {
  classes: Object,
  discoverDevices: Function,
  onClick?: Function,
  onAutoDetect?: Function,
  pairDiscoverFinished?: boolean,
  pairDiscovery: boolean,
  pairedDevice: Object,
};

type State = {
  displayType: ?string,
};

class GridDisplayTypes extends React.Component<Props, State> {
  state = {
    displayType: null,
  };

  handleSelect(type: string) {
    if (this.props.onClick) {
      this.props.onClick();
    }
    this.props.discoverDevices(type);
  }

  renderCheck(displayType: string) {
    const { classes } = this.props;
    return (
      <div className={classes.container}>
        <Typography>Please make sure your device is on and the cable is connected to <b>{PORT_NAMES[displayType]}</b> port on your {DISPLAY_NAMES[displayType]} device</Typography>
        <Button
          className={classes.button}
          variant='contained'
          color='secondary'
          onClick={() => this.handleSelect(displayType)}
        >
          Continue
        </Button>
        <Button className={classes.backButton} onClick={() => this.setState({ displayType: null })}>
          Back
        </Button>
      </div>
    );
  }

  render() {
    const { classes, pairDiscoverFinished, pairDiscovery, pairedDevice } = this.props;
    const { displayType } = this.state;
    if (pairDiscovery) {
      if (typeof pairDiscoverFinished !== 'boolean') {
        return (
          <Progress
            className={classes.progress}
            title='Finding devices'
          />
        );
      } else if (!pairedDevice) {
        return <Typography>No devices found</Typography>;
      }
      return <Typography className={classes.success}>{`Successfully paired ${pairedDevice.manufacturer} screen`}</Typography>;
    }

    if (displayType) {
      return this.renderCheck(displayType);
    }

    return (
      <div>
        <Button
          onClick={this.props.onAutoDetect}
          variant='contained'
          color='primary'
          className={classes.autoDetect}
        >
            Auto Detect
        </Button>
        <Typography className={classes.subtitle}>Select display type</Typography>
        <Grid container spacing={2}>
          {DISPLAYS.map((type: string) => (
            <GridItemDisplayType
              key={type}
              type={type}
              onClick={() => {
                if (type === TYPE_VIZIO) {
                  this.handleSelect(type);
                } else {
                  this.setState({ displayType: type });
                }
              }}
            />
          ))}
        </Grid>
      </div>
    );
  }
}


const withConnect = connect((state: StateType) => ({
  pairDiscoverFinished: pairDiscoverSelector(state),
  pairedDevice: pairedDeviceSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ discoverDevices }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(GridDisplayTypes);

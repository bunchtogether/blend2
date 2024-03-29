// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { List as ImmutableList } from 'immutable';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import GridDisplayTypes from 'components/GridDisplayTypes';
import ListDiscoveredDevices from 'components/ListDiscoveredDevices';
import SettingsPairDisplayVerification from 'components/SettingsPairDisplayVerification';
import Progress from 'components/Progress';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItemDevice from 'components/ListItemDevice';
import { resetPairing, unpairDevice, pairDiscover } from 'containers/App/actions';
import { pairDeviceSuccessSelector, discoveryDeviceTypeSelector, pairedDeviceSelector, discoveredDevicesSelector } from 'containers/App/selectors';
import { capitalize } from '../../utils';

const styles = (theme: Object) => ({
  title: {
    marginBottom: theme.spacing(2),
  },
  backButton: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(11),
  },
  success: {
    color: theme.palette.success[500],
  },
});

type Props = {
  classes: Object,
  resetPairing: Function,
  unpairDevice: Function,
  pairDiscover: Function,
  pairDeviceSuccess: ?boolean,
  discoveryDeviceType: string,
  pairedDevice: Object,
  discoveredDevices: ImmutableList<Object>,
};

type State = {
  activeStep: number,
  showPairedDevice: boolean,
  resetting: boolean,
  pairDiscovery: boolean,
};

class SettingsDisplay extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.resetting) {
      return {
        resetting: false,
      };
    }
    if (props.pairedDevice && state.activeStep === 0 && !state.pairDiscovery) {
      return {
        showPairedDevice: true,
        activeStep: 0,
        pairDiscovery: false,
      };
    }
    return null;
  }

  state = {
    activeStep: 0,
    showPairedDevice: false,
    resetting: false,
    pairDiscovery: false,
  };

  componentDidUpdate() {
    const { pairedDevice } = this.props;
    const { activeStep, pairDiscovery } = this.state;
    if (pairedDevice && (activeStep === 3 || pairDiscovery)) {
      setTimeout(() => this.setState({ showPairedDevice: true }), 2000);
    }
  }

  componentWillUnmount() {
    this.reset();
  }

  reset = () => {
    this.setState({ activeStep: 0, showPairedDevice: false, resetting: true });
    this.props.resetPairing();
  }

  handleAutoDetect = () => {
    this.setState({ pairDiscovery: true });
    this.props.pairDiscover();
  }

  handleNextStep = () => {
    const { activeStep } = this.state;
    this.setState({ activeStep: activeStep + 1 });
  }

  handlePreviousStep = () => {
    const { discoveredDevices } = this.props;
    const { activeStep } = this.state;
    if (activeStep === 2 && ImmutableList.isList(discoveredDevices) && discoveredDevices.size === 1) {
      this.setState({ activeStep: 0, pairDiscovery: false });
    } else {
      this.setState({ activeStep: activeStep > 0 ? activeStep - 1 : 0, pairDiscovery: false });
    }
  }

  renderPairMessage() {
    const { classes, pairDeviceSuccess, discoveryDeviceType } = this.props;
    if (!pairDeviceSuccess) {
      return <Progress title={`Pairing ${capitalize(discoveryDeviceType)} screen`} />;
    }
    return <Typography className={classes.success}>{`Successfully paired ${capitalize(discoveryDeviceType)} screen`}</Typography>;
  }

  renderStepContent(activeStep: number) {
    switch (activeStep) {
      case 0:
        return (
          <GridDisplayTypes
            onClick={this.handleNextStep}
            pairDiscovery={this.state.pairDiscovery}
            onAutoDetect={this.handleAutoDetect}
          />
        );
      case 1:
        return <ListDiscoveredDevices onClick={this.handleNextStep} />;
      case 2:
        return <SettingsPairDisplayVerification onClick={this.handleNextStep} />;
      default:
        return this.renderPairMessage();
    }
  }

  render() {
    const { classes, pairedDevice } = this.props;
    const { activeStep, showPairedDevice } = this.state;
    if (showPairedDevice && pairedDevice) {
      return (
        <div>
          <Typography className={classes.title} variant='h6'>Paired display</Typography>
          <List>
            <ListItemDevice
              device={pairedDevice}
              secondaryAction={(
                <Button
                  onClick={() => {
                    this.reset();
                    this.props.unpairDevice();
                  }}
                >
                  Remove
                </Button>
              )}
            />
          </List>
        </div>
      );
    }
    return (
      <div>
        <Typography className={classes.title} variant='h6'>Pair new display</Typography>
        {this.renderStepContent(activeStep)}
        {activeStep > 0 && activeStep < 3 || this.state.pairDiscovery ? (
          <Button className={classes.backButton} onClick={this.handlePreviousStep}>
            Back
          </Button>
        ) : null}
      </div>
    );
  }
}


const withConnect = connect((state: StateType) => ({
  pairDeviceSuccess: pairDeviceSuccessSelector(state),
  discoveryDeviceType: discoveryDeviceTypeSelector(state),
  pairedDevice: pairedDeviceSelector(state),
  discoveredDevices: discoveredDevicesSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ resetPairing, unpairDevice, pairDiscover }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsDisplay);

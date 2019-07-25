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
import { resetPairing, unpairDevice } from 'containers/App/actions';
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
  pairDeviceSuccess: ?boolean,
  discoveryDeviceType: string,
  pairedDevice: Object,
  discoveredDevices: ImmutableList<Object>,
};

type State = {
  activeStep: number,
};

class SettingsDisplay extends React.Component<Props, State> {
  state = {
    activeStep: 0,
  };

  componentDidMount() {
    this.reset();
  }

  componentWillUnmount() {
    this.reset();
  }

  reset = () => {
    this.setState({ activeStep: 0 });
    this.props.resetPairing();
  }

  handleNextStep = () => {
    const { activeStep } = this.state;
    this.setState({ activeStep: activeStep + 1 });
  }

  handlePreviousStep = () => {
    const { discoveredDevices } = this.props;
    const { activeStep } = this.state;
    if (activeStep === 2 && ImmutableList.isList(discoveredDevices) && discoveredDevices.size === 1) {
      this.setState({ activeStep: 0 });
    } else {
      this.setState({ activeStep: activeStep > 0 ? activeStep - 1 : 0 });
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
        return <GridDisplayTypes onClick={this.handleNextStep} />;
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
    const { activeStep } = this.state;
    if (pairedDevice) {
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
        {activeStep > 0 && activeStep < 3 ? (
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
}), (dispatch: Function): Object => bindActionCreators({ resetPairing, unpairDevice }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsDisplay);

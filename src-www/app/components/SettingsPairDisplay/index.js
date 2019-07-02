// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import GridDisplayTypes from 'components/GridDisplayTypes';
import ListDiscoveredDevices from 'components/ListDiscoveredDevices';
import SettingsPairDisplayVerification from 'components/SettingsPairDisplayVerification';
import Progress from 'components/Progress';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import { resetPairing } from 'containers/App/actions';
import { pairDeviceSuccessSelector, discoveryDeviceTypeSelector } from 'containers/App/selectors';
import { capitalize } from '../../utils';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  stepper: {
    padding: 0,
    paddingTop: theme.spacing(2),
    width: '100%',
  },
  stepContent: {
    alignSelf: 'flex-start',
    paddingTop: theme.spacing(4),
    width: '100%',
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
  pairDeviceSuccess: ?boolean,
  discoveryDeviceType: string,
};

type State = {
  activeStep: number,
};

const STEPS = [
  'Select display type',
  'Select display',
  'Enter pairing code',
];

class SettingsDisplay extends React.Component<Props, State> {
  state = {
    activeStep: 0,
  };

  componentWillUnmount() {
    this.setState({ activeStep: 0 });
    this.props.resetPairing();
  }

  handleNextStep = () => {
    const { activeStep } = this.state;
    this.setState({ activeStep: activeStep + 1 });
  }

  handlePreviousStep = () => {
    const { activeStep } = this.state;
    this.setState({ activeStep: activeStep > 0 ? activeStep - 1 : 0 });
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
    const { classes } = this.props;
    const { activeStep } = this.state;
    return (
      <div className={classes.container}>
        <Typography className={classes.title} variant='h6'>Pair new display</Typography>
        <Stepper activeStep={activeStep} className={classes.stepper} alternativeLabel>
          {STEPS.map((label:string) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div className={classes.stepContent}>
          {this.renderStepContent(activeStep)}
        </div>
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
}), (dispatch: Function): Object => bindActionCreators({ resetPairing }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsDisplay);

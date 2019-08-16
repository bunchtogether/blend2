// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Progress from 'components/Progress';
import Typography from '@material-ui/core/Typography';
import VerificationVizio from 'components/VerificationVizio';
import { pairDevice } from 'containers/App/actions';
import { startPairingSuccessSelector, discoveryDeviceTypeSelector } from 'containers/App/selectors';
import * as constants from '../../constants';

const styles = (theme: Object) => ({
  error: {
    color: theme.palette.error[500],
  },
});

type Props = {
  classes: Object,
  pairDevice: Function,
  onClick?: Function,
  startPairingSuccess: ?boolean,
  discoveryDeviceType: string,
};

class SettingsPairVerification extends React.PureComponent<Props> {
  handleSubmit = (data: Object) => {
    if (this.props.onClick) {
      this.props.onClick();
    }
    this.props.pairDevice(data);
  }

  render() {
    const { classes, startPairingSuccess, discoveryDeviceType } = this.props;
    if (startPairingSuccess === null) {
      return <Progress title='Initializing pairing' />;
    }
    if (!startPairingSuccess) {
      return <Typography className={classes.error}>{`Failed to pair ${constants.DISPLAY_NAMES[discoveryDeviceType]} device`}</Typography>;
    }
    switch (discoveryDeviceType) {
      case constants.TYPE_VIZIO:
        return <VerificationVizio handleSubmit={this.handleSubmit} />;
      case constants.TYPE_SAMSUNG:
        this.handleSubmit({});
        return null;
      case constants.TYPE_NEC:
        this.handleSubmit({});
        return null;
      default:
        return null;
    }
  }
}


const withConnect = connect((state: StateType) => ({
  startPairingSuccess: startPairingSuccessSelector(state),
  discoveryDeviceType: discoveryDeviceTypeSelector(state),
}),
(dispatch: Function): Object => bindActionCreators({ pairDevice }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsPairVerification);

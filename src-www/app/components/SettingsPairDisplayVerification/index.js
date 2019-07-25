// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Progress from 'components/Progress';
import VerificationVizio from 'components/VerificationVizio';
import VerificationSamsung from 'components/VerificationSamsung';
import { pairDevice } from 'containers/App/actions';
import { startPairingSuccessSelector, discoveryDeviceTypeSelector } from 'containers/App/selectors';
import * as constants from '../../constants';

const styles = () => ({
});

type Props = {
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
    const { startPairingSuccess, discoveryDeviceType } = this.props;
    if (!startPairingSuccess) {
      return <Progress title='Initializing pairing' />;
    }
    switch (discoveryDeviceType) {
      case constants.TYPE_VIZIO:
        return <VerificationVizio handleSubmit={this.handleSubmit} />;
      case constants.TYPE_SAMSUNG:
        return <VerificationSamsung handleSubmit={this.handleSubmit} />;
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

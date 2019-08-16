// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { List as ImmutableList } from 'immutable';
import { withStyles } from '@material-ui/core/styles';
import { discoveredDevicesSelector, discoveryDeviceTypeSelector } from 'containers/App/selectors';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItemDevice from 'components/ListItemDevice';
import Progress from 'components/Progress';
import { startPairing } from 'containers/App/actions';
import { DISPLAY_NAMES } from '../../constants';

const styles = (theme: Object) => ({
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 40,
  },
  error: {
    color: theme.palette.error[500],
  },
});

type Props = {
  classes: Object,
  onClick?: Function,
  startPairing: Function,
  discoveryDeviceType: string,
  discoveredDevices: ImmutableList<Object>,
};

class ListDiscoveredDevices extends React.PureComponent<Props> {
  componentDidUpdate() {
    const { discoveredDevices } = this.props;
    if (discoveredDevices && discoveredDevices.size === 1) {
      this.handleClick(discoveredDevices.first());
    }
  }

  handleClick(device: Object) {
    const { discoveryDeviceType } = this.props;
    if (this.props.onClick) {
      this.props.onClick();
    }
    this.props.startPairing(discoveryDeviceType, device);
  }

  render() {
    const { classes, discoveredDevices, discoveryDeviceType } = this.props;
    if (!discoveredDevices) {
      return <Progress title={`Searching for ${DISPLAY_NAMES[discoveryDeviceType]} displays`} />;
    }
    if (discoveredDevices.size === 0) {
      return <Typography className={classes.error}>{`No ${DISPLAY_NAMES[discoveryDeviceType]} displays found`}</Typography>;
    }
    return (
      <List>
        {discoveredDevices.toJS().map((device: Object) => (
          <ListItemDevice
            key={device.name || device.ip || device.path}
            device={device}
            onClick={() => this.handleClick(device)}
          />
        ))}
      </List>
    );
  }
}


const withConnect = connect((state:StateType) => ({
  discoveredDevices: discoveredDevicesSelector(state),
  discoveryDeviceType: discoveryDeviceTypeSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ startPairing }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(ListDiscoveredDevices);

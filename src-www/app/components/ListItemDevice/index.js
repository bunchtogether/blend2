// @flow
/* eslint-disable global-require */

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import TvIcon from '@material-ui/icons/Tv';
import * as constants from '../../constants';

const styles = () => ({
});

type Props = {
  device: Object,
  onClick: Function,
  secondaryAction?: React.Node,
};


class ListItemDevice extends React.PureComponent<Props> {
  renderText() {
    const { device } = this.props;
    switch (device.type) {
      case constants.TYPE_VIZIO:
        return (
          <ListItemText
            primary={`${device.name} - ${device.ip}`}
            secondary={`${device.manufacturer} ${device.model}`}
          />
        );
      case constants.TYPE_SAMSUNG:
        return (
          <ListItemText
            primary={`${device.manufacturer || device.path}`}
            secondary={`${device.manufacturer ? device.path : ''}`}
          />
        );
      case constants.TYPE_NEC:
        return (
          <ListItemText
            primary={`${device.manufacturer || device.path}`}
            secondary={`${device.manufacturer ? device.path : ''}`}
          />
        );
      default:
        return null;
    }
  }

  render() {
    const { secondaryAction } = this.props;
    return (
      <ListItem button={!!this.props.onClick} onClick={this.props.onClick}>
        <ListItemIcon>
          <TvIcon />
        </ListItemIcon>
        {this.renderText()}
        {secondaryAction ? (
          <ListItemSecondaryAction>
            {secondaryAction}
          </ListItemSecondaryAction>
        ) : null}
      </ListItem>
    );
  }
}

export default withStyles(styles)(ListItemDevice);

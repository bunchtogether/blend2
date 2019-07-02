// @flow
/* eslint-disable global-require */

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import TvIcon from '@material-ui/icons/Tv';

const styles = () => ({
});

type Props = {
  device: Object,
  onClick: Function,
};

class ListItemDevice extends React.PureComponent<Props> {
  render() {
    const { device } = this.props;
    return (
      <ListItem button onClick={this.props.onClick}>
        <ListItemIcon>
          <TvIcon />
        </ListItemIcon>
        <ListItemText
          primary={`${device.name} - ${device.ip}`}
          secondary={`${device.manufacturer} ${device.model}`}
        />
      </ListItem>
    );
  }
}

export default withStyles(styles)(ListItemDevice);

// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';

const styles = () => ({
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 40,
  },
});

type Props = {
  classes: Object,
  title: string,
  className?: string
};

class ListDiscoveredDevices extends React.PureComponent<Props> {
  render() {
    const { classes, title } = this.props;
    const className = this.props.className ? `${classes.progressContainer} ${this.props.className}` : classes.progressContainer;
    return (
      <div className={className}>
        <Typography>{title}</Typography>
        <LinearProgress color="secondary" />
      </div>
    );
  }
}


export default withStyles(styles)(ListDiscoveredDevices);

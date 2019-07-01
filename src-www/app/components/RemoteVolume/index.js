// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
import VolumeDown from '@material-ui/icons/VolumeDown';
import VolumeUp from '@material-ui/icons/VolumeUp';
import { grey } from '@material-ui/core/colors';

const styles = (theme: Object) => ({
  volumeTextContainer: {
    alignSelf: 'flex-start',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: theme.spacing(1),
  },
  title: {
    fontWeight: 700,
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: grey[600],
  },
  root: {
    marginTop: -2,
  },
  rail: {
    marginTop: 2,
  },
  track: {
    height: 4,
    marginBottom: 3,
  },
  thumb: {
    width: 15,
    height: 15,
    paddingBottom: -7,
  },
});

type Props = {
  classes: ClassesType,
};

type State = {
  volume: number,
};

class RemoteVolume extends React.Component<Props, State> {
  state = {
    volume: 0,
  };

  render() {
    const { classes } = this.props;
    const { volume } = this.state;
    return (
      <React.Fragment>
        <div className={classes.volumeTextContainer}>
          <Typography className={classes.title}>Volume:&nbsp;</Typography>
          <Typography className={classes.value}>{volume}</Typography>
        </div>
        <Grid container spacing={2}>
          <Grid item>
            <VolumeDown />
          </Grid>
          <Grid item xs>
            <Slider
              value={volume}
              onChange={(event: Event, vol: number) => this.setState({ volume: vol })}
              classes={{
                root: classes.root,
                track: classes.track,
                thumb: classes.thumb,
                rail: classes.rail,
              }}
            />
          </Grid>
          <Grid item>
            <VolumeUp />
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(RemoteVolume);

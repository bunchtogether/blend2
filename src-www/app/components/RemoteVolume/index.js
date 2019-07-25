// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import RemoteSection from 'components/RemoteSection';
import { setVolume } from 'containers/App/actions';

const styles = (theme: Object) => ({
  root: {
    marginLeft: 8,
  },
  rail: {
    marginTop: 2,
    backgroundColor: theme.palette.secondary.light,
  },
  track: {
    height: 4,
    marginBottom: 3,
    backgroundColor: theme.palette.secondary.main,
  },
  thumb: {
    width: 15,
    height: 15,
    paddingBottom: -7,
    backgroundColor: theme.palette.secondary.main,
  },
});

type Props = {
  classes: ClassesType,
  setVolume: Function,
};

type State = {
  init: boolean,
  volume: number,
};

class RemoteVolume extends React.Component<Props, State> {
  state = {
    init: false,
    volume: 0,
  };

  render() {
    const { classes } = this.props;
    const { volume, init } = this.state;
    return (
      <RemoteSection
        icon={<VolumeUpIcon />}
        title='Volume:'
        value={init ? volume : ''}
      >
        <div className={classes.root}>
          <Slider
            value={volume}
            onChange={(event: Event, vol: number) => {
              this.setState({ volume: vol, init: true });
              this.props.setVolume(vol);
            }}
            classes={{
              track: classes.track,
              thumb: classes.thumb,
              rail: classes.rail,
            }}
            color='secondary'
          />
        </div>
      </RemoteSection>
    );
  }
}

const withConnect = connect(
  null,
  (dispatch: Function): Object => bindActionCreators({ setVolume }, dispatch),
);

export default compose(
  withStyles(styles),
  withConnect,
)(RemoteVolume);

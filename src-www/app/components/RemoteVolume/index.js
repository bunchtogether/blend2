// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import RemoteSection from 'components/RemoteSection';
import { volumeSelector } from 'containers/App/selectors';

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
  volume: number, // eslint-disable-line react/no-unused-prop-types
};

type State = {
  volume: number,
};

class RemoteVolume extends React.Component<Props, State> {
  static getDerivedStateFromProps(props, state) {
    if (props.volume !== state.volume) {
      return { volume: props.volume };
    }
    return null;
  }

  state = {
    volume: 0,
  };

  render() {
    const { classes } = this.props;
    const { volume } = this.state;
    return (
      <RemoteSection
        icon={<VolumeUpIcon />}
        title='Volume:'
        value={volume}
      >
        <div className={classes.root}>
          <Slider
            value={volume}
            onChange={(event: Event, vol: number) => this.setState({ volume: vol })}
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

const withConnect = connect((state: StateType) => ({
  volume: volumeSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(RemoteVolume);

// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import VolumeMuteIcon from '@material-ui/icons/VolumeMute';
import RemoteSection from 'components/RemoteSection';
import { muteSelector } from 'containers/App/selectors';
import { setMute } from 'containers/App/actions';

const styles = () => ({
});

type Props = {
  setMute: Function,
  mute: boolean, // eslint-disable-line react/no-unused-prop-types
};

type State = {
  muteProp: boolean,
  mute: boolean,
};

class RemoteMute extends React.Component<Props, State> {
  static getDerivedStateFromProps(props, state) {
    if (props.mute !== state.muteProp) {
      return { mute: props.mute, muteProp: props.mute };
    }
    return null;
  }

  state = {
    muteProp: false,
    mute: false,
  }

  render() {
    const { mute } = this.state;
    return (
      <RemoteSection
        icon={<VolumeMuteIcon />}
        title='Mute:'
        value={mute ? 'On' : 'Off'}
      >
        <Switch
          edge='start'
          checked={mute}
          onChange={(event: Event, value: boolean) => {
            this.setState({ mute: value });
            this.props.setMute(value);
          }}
        />
      </RemoteSection>
    );
  }
}

const withConnect = connect((state: StateType) => ({
  mute: muteSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ setMute }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(RemoteMute);

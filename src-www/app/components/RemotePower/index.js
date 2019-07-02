// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import RemoteSection from 'components/RemoteSection';
import { powerSelector } from 'containers/App/selectors';

const styles = () => ({
});

type Props = {
  power: boolean, // eslint-disable-line react/no-unused-prop-types
};

type State = {
  power: boolean,
};

class RemotePower extends React.Component<Props, State> {
  static getDerivedStateFromProps(props, state) {
    if (props.power !== state.power) {
      return { power: props.power };
    }
    return null;
  }

  state = {
    power: false,
  }

  render() {
    const { power } = this.state;
    return (
      <RemoteSection
        icon={<PowerSettingsNewIcon />}
        title='Power:'
        value={power ? 'on' : 'off'}
      >
        <Switch
          edge='start'
          checked={power}
          onChange={(event: Event, value: boolean) => this.setState({ power: value })}
        />
      </RemoteSection>
    );
  }
}

const withConnect = connect((state: StateType) => ({
  power: powerSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(RemotePower);

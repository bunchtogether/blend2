// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import RemoteSection from 'components/RemoteSection';
import { powerSelector } from 'containers/App/selectors';
import { setPower } from 'containers/App/actions';

const styles = () => ({
});

type Props = {
  setPower: Function,
  power: boolean, // eslint-disable-line react/no-unused-prop-types
};

type State = {
  powerProp: boolean,
  power: boolean,
};

class RemotePower extends React.Component<Props, State> {
  static getDerivedStateFromProps(props, state) {
    if (props.power !== state.powerProp) {
      return { power: props.power, powerProp: props.power };
    }
    return null;
  }

  state = {
    powerProp: false,
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
          onChange={(event: Event, value: boolean) => {
            this.setState({ power: value });
            this.props.setPower(value);
          }}
        />
      </RemoteSection>
    );
  }
}

const withConnect = connect((state: StateType) => ({
  power: powerSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ setPower }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(RemotePower);

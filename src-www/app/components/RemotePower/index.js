// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import RemoteSection from 'components/RemoteSection';

const styles = () => ({
});

type Props = {
};

type State = {
  power: boolean,
};

class RemotePower extends React.Component<Props, State> {
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

export default withStyles(styles)(RemotePower);

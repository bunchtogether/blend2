// @flow

import * as React from 'react';
import NavigationBase from 'components/NavigationBase';
import NavigationItem from 'components/NavigationItem';
import DialogSettings from 'components/DialogSettings';
import DialogStream from 'components/DialogStream';
import { navigateRemote, navigateSetup } from 'containers/App/actions';
import SettingsIcon from '@material-ui/icons/Settings';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import SettingsRemoteIcon from '@material-ui/icons/SettingsRemote';
import SettingsEthernet from '@material-ui/icons/SettingsEthernet';
import { green, blue, orange } from '@material-ui/core/colors';
import LogoSrc from '../../static/blend-white.svg';

type Props = {
};

type State = {
  settingsDialogOpen: boolean,
  streamDialogOpen: boolean,
};

const logoStyle = {
  width: '100%',
  height: '100%',
  backgroundRepeat: 'no-repeat',
  backgroundImage: `url(${LogoSrc})`,
  backgroundSize: 'contain',
  backgroundPosition: '50% 50%',
  transform: 'scale(0.9)',
};

export default class Navigation extends React.Component<Props, State> {
  state = {
    settingsDialogOpen: false,
    streamDialogOpen: false,
  };

  openSettingsDialog = () => this.setState({ settingsDialogOpen: true });
  closeSettingsDialog = () => this.setState({ settingsDialogOpen: false });

  openStreamDialog = () => this.setState({ streamDialogOpen: true });
  closeStreamDialog = () => this.setState({ streamDialogOpen: false });

  renderHeader() {
    return (
      <div style={logoStyle} />
    );
  }

  renderFooter() {
    const { settingsDialogOpen } = this.state;
    return (
      <React.Fragment>
        <NavigationItem label='Settings' icon={<SettingsIcon />} onClick={this.openSettingsDialog} />
        <DialogSettings
          open={settingsDialogOpen}
          onClose={this.closeSettingsDialog}
        />
      </React.Fragment>
    );
  }

  render() {
    const { streamDialogOpen } = this.state;
    return (
      <React.Fragment>
        <NavigationBase header={this.renderHeader()} footer={this.renderFooter()}>
          <NavigationItem
            pathnames={['/stream']}
            label='Stream'
            icon={<PlayCircleFilledIcon />}
            onClick={this.openStreamDialog}
            color={green[500]}
          />
          <NavigationItem
            pathnames={['/remote']}
            label='Remote'
            icon={<SettingsRemoteIcon />}
            action={navigateRemote}
            color={blue[700]}
          />
          <NavigationItem
            pathnames={['/setup']}
            label='Setup'
            icon={<SettingsEthernet />}
            action={navigateSetup}
            color={orange[500]}
          />
          <DialogStream
            open={streamDialogOpen}
            onClose={this.closeStreamDialog}
          />
        </NavigationBase>
      </React.Fragment>
    );
  }
}

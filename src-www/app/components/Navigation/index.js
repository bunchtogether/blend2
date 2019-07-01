// @flow

import * as React from 'react';
import NavigationBase from 'components/NavigationBase';
import NavigationItem from 'components/NavigationItem';
import DialogSettings from 'components/DialogSettings';
import DialogStream from 'components/DialogStream';
import { navigateRemote } from 'containers/App/actions';
import SettingsIcon from '@material-ui/icons/Settings';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import SettingsRemoteIcon from '@material-ui/icons/SettingsRemote';
import LogoSrc from '../../static/blend.svg';

type Props = {
};

type State = {
  settingsDialogOpen: boolean,
  streamDialogOpen: boolean,
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
      <img
        src={LogoSrc}
        alt='Blend'
        style={{ width: 110, marginLeft: -10 }}
      />
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
          />
          <NavigationItem
            pathnames={['/remote']}
            label='Remote'
            icon={<SettingsRemoteIcon />}
            action={navigateRemote}
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

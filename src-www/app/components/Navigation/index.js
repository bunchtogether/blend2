// @flow

import * as React from 'react';
import NavigationBase from 'components/NavigationBase';
import NavigationItem from 'components/NavigationItem';
import DialogSettings from 'components/DialogSettings';
import SettingsIcon from '@material-ui/icons/Settings';
import BubbleChartIcon from '@material-ui/icons/PlayCircleFilled';
import { navigateStream } from 'containers/App/actions';
import LogoSrc from '../../static/blend-white.png';

type Props = {
};

type State = {
  settingsDialogOpen: boolean,
};

export default class Navigation extends React.Component<Props, State> {
  state = {
    settingsDialogOpen: false,
  };

  openSettingsDialog = () => this.setState({ settingsDialogOpen: true });
  closeSettingsDialog = () => this.setState({ settingsDialogOpen: false });

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
    return (
      <React.Fragment>
        <NavigationBase header={this.renderHeader()} footer={this.renderFooter()}>
          <NavigationItem
            pathnames={['/stream']}
            label='Stream'
            icon={<BubbleChartIcon />}
            action={navigateStream}
          />
        </NavigationBase>
      </React.Fragment>
    );
  }
}

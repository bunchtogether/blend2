// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import InputIcon from '@material-ui/icons/Input';
import RemoteSection from 'components/RemoteSection';

const styles = () => ({
});

type Props = {
};

type State = {
  source: string,
};

class RemoteSource extends React.Component<Props, State> {
  state = {
    source: 'tv',
  }

  render() {
    const { source } = this.state;
    return (
      <RemoteSection
        icon={<InputIcon />}
        title='Source:'
        value={source}
      />
    );
  }
}

export default withStyles(styles)(RemoteSource);

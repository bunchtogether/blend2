// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import VolumeMuteIcon from '@material-ui/icons/VolumeMute';
import RemoteSection from 'components/RemoteSection';
import { toggleMute } from 'containers/App/actions';

const styles = (theme: Object) => ({
  fab: {
    marginRight: theme.spacing(2),
    boxShadow: 'unset',
  },
});

type Props = {
  classes: Object,
  toggleMute: Function,
};

class RemoteMute extends React.PureComponent<Props> {
  render() {
    const { classes } = this.props;
    return (
      <RemoteSection
        icon={<VolumeMuteIcon />}
        title='Mute:'
      >
        <Fab
          className={classes.fab}
          color='secondary'
          onClick={() => this.props.toggleMute()}
        >
          <VolumeMuteIcon />
        </Fab>
      </RemoteSection>
    );
  }
}

const withConnect = connect(
  null,
  (dispatch: Function): Object => bindActionCreators({ toggleMute }, dispatch),
);

export default compose(
  withStyles(styles),
  withConnect,
)(RemoteMute);

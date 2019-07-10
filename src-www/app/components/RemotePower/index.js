// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import PowerIcon from '@material-ui/icons/Power';
import PowerOffIcon from '@material-ui/icons/PowerOff';
import RemoteSection from 'components/RemoteSection';
import { setPower } from 'containers/App/actions';

const styles = (theme: Object) => ({
  fab: {
    marginRight: theme.spacing(2),
    boxShadow: 'unset',
  },
});

type Props = {
  classes: Object,
  setPower: Function,
};

class RemotePower extends React.PureComponent<Props> {
  render() {
    const { classes } = this.props;
    return (
      <RemoteSection
        icon={<PowerSettingsNewIcon />}
        title='Power:'
      >
        <Fab
          className={classes.fab}
          color='secondary'
          onClick={() => this.props.setPower(true)}
        >
          <PowerIcon />
        </Fab>
        <Fab
          className={classes.fab}
          color='secondary'
          onClick={() => this.props.setPower(false)}
        >
          <PowerOffIcon />
        </Fab>
      </RemoteSection>
    );
  }
}

const withConnect = connect(
  null,
  (dispatch: Function): Object => bindActionCreators({ setPower }, dispatch),
);

export default compose(
  withStyles(styles),
  withConnect,
)(RemotePower);

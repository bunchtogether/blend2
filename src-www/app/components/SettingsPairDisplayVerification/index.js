// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import Progress from 'components/Progress';
import { pairDevice, setPower } from 'containers/App/actions';
import PowerIcon from '@material-ui/icons/Power';
import PowerOffIcon from '@material-ui/icons/PowerOff';
import { startPairingSuccessSelector, discoveryDeviceTypeSelector } from 'containers/App/selectors';
import * as constants from '../../constants';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
  title: {
    marginBottom: theme.spacing(2),
  },
});

type Props = {
  classes: Object,
  pairDevice: Function,
  setPower: Function,
  onClick?: Function,
  startPairingSuccess: ?boolean,
  discoveryDeviceType: string,
};

type State = {
  code: string,
};

class SettingsPairVerification extends React.Component<Props, State> {
  state = {
    code: '',
  }

  handleSubmit = () => {
    if (this.props.onClick) {
      this.props.onClick();
    }
    this.props.pairDevice({ code: this.state.code });
  }

  renderVizio() {
    const { classes } = this.props;
    const { code } = this.state;
    return (
      <div className={classes.container}>
        <TextField
          fullWidth
          value={code}
          onChange={(event:Object) => this.setState({ code: event.target.value })}
          label='Pairing code'
        />
        <Button
          onClick={this.handleSubmit}
          className={classes.button}
          variant='contained'
          color='primary'
          disabled={!code}
        >
          Submit
        </Button>
      </div>
    );
  }

  renderSamsung() {
    const { classes } = this.props;
    return (
      <div>
        <Typography className={classes.title}>
          Please confirm that you can switch the power <b>on</b> and <b>off</b>.
        </Typography>
        <div className={classes.container} style={{ marginRight: 10 }}>
          <div>
            <Fab
              onClick={() => this.props.setPower(true)}
              className={classes.button}
              color='primary'
            >
              <PowerIcon />
            </Fab>
            <Fab
              onClick={() => this.props.setPower(false)}
              className={classes.button}
              color='primary'
            >
              <PowerOffIcon />
            </Fab>
          </div>
          <Button
            onClick={this.handleSubmit}
            className={classes.button}
            variant='contained'
            color='primary'
          >
            Confirm
          </Button>
        </div>
      </div>
    );
  }

  renderContent() {
    const { discoveryDeviceType } = this.props;
    switch (discoveryDeviceType) {
      case constants.TYPE_VIZIO:
        return this.renderVizio();
      case constants.TYPE_SAMSUNG:
        return this.renderSamsung();
      default:
        return null;
    }
  }

  render() {
    const { startPairingSuccess } = this.props;
    if (!startPairingSuccess) {
      return <Progress title='Initializing pairing' />;
    }
    return this.renderContent();
  }
}


const withConnect = connect((state: StateType) => ({
  startPairingSuccess: startPairingSuccessSelector(state),
  discoveryDeviceType: discoveryDeviceTypeSelector(state),
}),
(dispatch: Function): Object => bindActionCreators({ pairDevice, setPower }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsPairVerification);

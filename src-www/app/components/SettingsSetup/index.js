// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { List } from 'immutable';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { setDeviceIp, getDeviceIp } from 'containers/App/actions';
import { deviceIpSelector } from 'containers/App/selectors';

const styles = (theme: Object) => ({
  container: {
    width: '100%',
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  textFieldContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  textField: {
    width: 100,
  },
  ipDot: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    fontSize: 40,
  },
  button: {
    width: 100,
    marginTop: theme.spacing(1),
  },
  marginTop: {
    marginTop: theme.spacing(1),
  },
  error: {
    color: 'red',
  },
});

type Props = {
  classes: Object,
  deviceIp: string | null,
  setDeviceIp: Function,
  getDeviceIp: Function,
};

type State = {
  ip1: string,
  ip2: string,
  ip3: string,
  ip4: string,
  error: boolean,
};

class SettingsSetup extends React.Component<Props, State> {
  state = {
    ip1: '',
    ip2: '',
    ip3: '',
    ip4: '',
    error: false,
  };

  componentDidMount() {
    if (this.props.deviceIp) {
      this.handleSetIp(this.props.deviceIp);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.deviceIp !== this.props.deviceIp && this.props.deviceIp) {
      this.handleSetIp(this.props.deviceIp)
    }
  }

  validate = () => {
    const { ip1, ip2, ip3, ip4 } = this.state;
    if (!ip1 && ip1 !== '0') {
      return false;
    }
    if (!ip2 && ip2 !== '0') {
      return false;
    }
    if (!ip3 && ip3 !== '0') {
      return false;
    }
    if (!ip4 && ip4 !== '0') {
      return false;
    }
    return true;
  }

  handleSetIp = (ip: string) => {
    const [ip1, ip2, ip3, ip4] = ip.split('.');
    this.setState({ ip1, ip2, ip3, ip4 });
  }

  handleSubmit = () => {
    const { ip1, ip2, ip3, ip4 } = this.state;
    if (this.validate()) {
      this.props.setDeviceIp(`${ip1}.${ip2}.${ip3}.${ip4}`);
    } else {
      this.setState({ error: true });
    }
  }

  render() {
    const { classes, availableLogs } = this.props;
    const logFiles = List.isList(availableLogs) ? availableLogs.toJS() : [];
    return (
      <div className={classes.container}>
        <Typography className={classes.marginTop}>Update the static IP address of this device</Typography>
        <div className={classes.textFieldContainer}>
          <TextField
            variant="outlined"
            autoFocus
            name="ip1"
            id="ip1"
            className={classes.textField}
            value={this.state.ip1}
            placeholder="192"
            onChange={(event: Object) => this.setState({ ip1: event.target.value, error: false })}
            error={this.state.error}
          />
          <Typography className={classes.ipDot}>.</Typography>
          <TextField
            variant="outlined"
            name="ip2"
            id="ip2"
            placeholder="168"
            value={this.state.ip2}
            className={classes.textField}
            onChange={(event: Object) => this.setState({ ip2: event.target.value, error: false })}
            error={this.state.error}
          />
          <Typography className={classes.ipDot}>.</Typography>
          <TextField
            variant="outlined"
            name="ip3"
            id="ip3"
            placeholder="1"
            value={this.state.ip3}
            className={classes.textField}
            onChange={(event: Object) => this.setState({ ip3: event.target.value, error: false })}
            error={this.state.error}
          />
          <Typography className={classes.ipDot}>.</Typography>
          <TextField
            variant="outlined"
            name="ip4"
            id="ip4"
            placeholder="1"
            value={this.state.ip4}
            className={classes.textField}
            onChange={(event: Object) => this.setState({ ip4: event.target.value, error: false })}
            error={this.state.error}
          />
        </div>
        {this.state.error ? <Typography className={classes.error}>Enter a complete IP address</Typography> : null}
        <Button className={classes.button} variant='contained' color='primary' onClick={this.handleSubmit}>
          Submit
        </Button>
      </div>
    );
  }
}


const withConnect = connect((state: StateType) => ({
  deviceIp: deviceIpSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ setDeviceIp }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsSetup);

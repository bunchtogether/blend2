// @flow

/**
 *
 * Setup
 *
 */

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { Helmet } from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Navigation from 'components/Navigation';
import Content from 'components/Content';
import Header from 'components/Header';
import { getDeviceIp, setDeviceIp, navigateRemote } from 'containers/App/actions';
import { deviceIpSelector } from 'containers/App/selectors';

const styles = (theme:Object) => ({ // eslint-disable-line no-unused-vars
  container: {
    width: '100%',
    height: '100vh',
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textFieldContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: theme.spacing(5),
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
    marginTop: theme.spacing(4),
  },
  marginTop: {
    marginTop: theme.spacing(1),
  },
  error: {
    color: 'red',
  },
});

type Props = {
  dispatch: Function,
  getDeviceIp: Function,
  setDeviceIp: Function,
  navigateRemote: Function,
};

type State = {
  ip1: string,
  ip2: string,
  ip3: string,
  ip4: string,
  error: boolean,
};

export class Setup extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  constructor(props: Props) {
    super(props);
    this.state = {
      ip1: '',
      ip2: '',
      ip3: '',
      ip4: '',
      error: false,
    };
  }

  componentDidMount() {
    if (this.props.deviceIp) {
      this.props.navigateRemote();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.deviceIp !== this.props.deviceIp && this.props.deviceIp) {
      this.props.navigateRemote();
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
  
  handleSubmit = () => {
    const { ip1, ip2, ip3, ip4 } = this.state;
    if (this.validate()) {
      this.props.setDeviceIp(`${ip1}.${ip2}.${ip3}.${ip4}`);
    } else {
      this.setState({ error: true });
    }
  }

  render() {
    const { classes, deviceIp } = this.props;
    console.log('device ip: ', deviceIp)
    if (deviceIp === null) {
      return (
        <div className={classes.container}>
          <CircularProgress />
        </div>
      )
    }
    return (
      <React.Fragment>
        <Helmet>
          <title>Setup</title>
          <meta name="description" content="Description of Setup" />
        </Helmet>
        <Header showSearch={false} />
        <div className={classes.container}>
          <Typography variant='h4'>Device Initialization</Typography>
          <Typography className={classes.marginTop}>Set the static IP address of this device</Typography>
          <div className={classes.textFieldContainer}>
            <TextField
              variant="outlined"
              autoFocus
              name="ip1"
              id="ip1"
              className={classes.textField}
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
              className={classes.textField}
              onChange={(event: Object) => this.setState({ ip4: event.target.value, error: false })}
              error={this.state.error}
            />
          </div>
          {this.state.error ? <Typography className={classes.error}>Enter a complete IP address</Typography> : null}
          <Button className={classes.button} onClick={this.handleSubmit}>
            Submit
          </Button>
        </div>
      </React.Fragment>
    );
  }
}


const withConnect = connect((state: StateType) => ({
  deviceIp: deviceIpSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ setDeviceIp, getDeviceIp, navigateRemote }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(Setup);

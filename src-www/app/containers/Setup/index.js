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
import Header from 'components/Header';
import { setDeviceIp, navigateRemote, skipDeviceIp } from 'containers/App/actions';
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
    width: 80,
  },
  ipDot: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    fontSize: 40,
  },
  button: {
    width: 100,
    marginTop: theme.spacing(3),
    backgroundColor: theme.palette.secondary.light,
    '&:hover': {
      backgroundColor: theme.palette.secondary.main,
    }
  },
  title: {
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  error: {
    color: 'red',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orText: {
    marginBottom: theme.spacing(5),
    marginTop: theme.spacing(5),
  },
  skipButton: {
    marginBottom: theme.spacing(2),
  },
  dismissButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 12,
  },
});

type Props = {
  setDeviceIp: Function,
  navigateRemote: Function,
  deviceIp: string,
  classes: Object,
};

type State = {
  ip1: string,
  ip2: string,
  ip3: string,
  ip4: string,
  error: boolean,
};

const IP_MAX_LENGTH = 3;

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

  handleChange = (event: Event) => {
    console.log("event.target: ", event.target.value.length)
    if (event.target.value.length <= IP_MAX_LENGTH) {
      console.log("setting state: ")
      this.setState({ [event.target.id]: event.target.value, error: false })
    }
    if (event.target.value && event.target.value.length === IP_MAX_LENGTH) {
      const ipCount = parseInt(event.target.id[2], 10);
      if (ipCount < 4) {
        const nextElement = document.getElementById(`ip${ipCount + 1}`);
        nextElement.focus();
      }
    }
  }

  handleSkip = () => {
    this.props.skipDeviceIp();
    this.props.navigateRemote();
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
    if (deviceIp === null) {
      return (
        <div className={classes.container}>
          <CircularProgress />
        </div>
      );
    }
    return (
      <React.Fragment>
        <Helmet>
          <title>Setup</title>
          <meta name="description" content="Description of Setup" />
        </Helmet>
        <Header showSearch={false} />
        <div className={classes.container}>
          <Typography className={classes.title} variant="h6">Device Initialization: Enter the IP address of the hardware management server</Typography>
          <div className={classes.textFieldContainer}>
            <TextField
              variant="outlined"
              autoFocus
              name="ip1"
              id="ip1"
              value={this.state.ip1}
              className={classes.textField}
              placeholder="192"
              onChange={this.handleChange}
              error={this.state.error}
              inputProps={{
                style: {
                  textAlign: 'center',
                },
              }}
            />
            <Typography className={classes.ipDot}>.</Typography>
            <TextField
              variant="outlined"
              name="ip2"
              id="ip2"
              value={this.state.ip2}
              placeholder="168"
              className={classes.textField}
              onChange={this.handleChange}
              error={this.state.error}
              inputProps={{
                style: {
                  textAlign: 'center',
                },
              }}
            />
            <Typography className={classes.ipDot}>.</Typography>
            <TextField
              variant="outlined"
              name="ip3"
              id="ip3"
              value={this.state.ip3}
              placeholder="1"
              className={classes.textField}
              onChange={this.handleChange}
              error={this.state.error}
              inputProps={{
                style: {
                  textAlign: 'center',
                },
              }}
            />
            <Typography className={classes.ipDot}>.</Typography>
            <TextField
              variant="outlined"
              name="ip4"
              id="ip4"
              value={this.state.ip4}
              placeholder="1"
              className={classes.textField}
              onChange={this.handleChange}
              error={this.state.error}
              inputProps={{
                style: {
                  textAlign: 'center',
                },
              }}
            />
          </div>
          {this.state.error ? <Typography className={classes.error}>Enter a complete IP address</Typography> : null}
          <div className={classes.buttonContainer}>
            <Button className={classes.button} onClick={this.handleSubmit}>
              Save
            </Button>
            <Typography className={classes.orText}>- or -</Typography>
            <div className={classes.dismissButtonContainer}>
              <Button className={classes.skipButton} onClick={this.handleSkip}>
                Dismiss
              </Button>
              <Typography className={classes.dismissText}>You can enter and edit the address at a later time in settings</Typography>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}


const withConnect = connect((state: StateType) => ({
  deviceIp: deviceIpSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ setDeviceIp, navigateRemote, skipDeviceIp }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(Setup);

// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Progress from 'components/Progress';
import { pairDevice } from 'containers/App/actions';
import { startPairingSuccessSelector } from 'containers/App/selectors';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
});

type Props = {
  classes: Object,
  pairDevice: Function,
  onClick?: Function,
  startPairingSuccess: ?boolean,
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
  render() {
    const { classes, startPairingSuccess } = this.props;
    const { code } = this.state;
    if (!startPairingSuccess) {
      return <Progress title='Initializing pairing' />;
    }
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
}


const withConnect = connect((state: StateType) => ({
  startPairingSuccess: startPairingSuccessSelector(state),
}),
(dispatch: Function): Object => bindActionCreators({ pairDevice }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsPairVerification);

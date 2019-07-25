// @flow

import * as React from 'react';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

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
  handleSubmit: Function,
};

type State = {
  code: string,
};

class VerificationVizio extends React.Component<Props, State> {
  state = {
    code: '',
  }

  render() {
    const { classes } = this.props;
    const { code } = this.state;
    return (
      <div>
        <Typography>Enter the code you see on your Vizio display</Typography>
        <div className={classes.container}>
          <TextField
            fullWidth
            value={code}
            onChange={(event:Object) => this.setState({ code: event.target.value })}
            label='Pairing code'
          />
          <Button
            onClick={() => this.props.handleSubmit({ code: this.state.code })}
            className={classes.button}
            variant='contained'
            color='secondary'
            disabled={!code}
          >
            Submit
          </Button>
        </div>
      </div>
    );
  }
}

export default compose(
  withStyles(styles),
)(VerificationVizio);

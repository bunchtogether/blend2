// @flow

import * as React from 'react';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import Button from '@material-ui/core/Button';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    marginBottom: theme.spacing(2),
  },
});

type Props = {
  classes: Object,
  handleSubmit: Function,
};

type State = {
  completed: number,
  lastTime: number,
};

const DURATION = 30000;

class VerificationRS232 extends React.Component<Props, State> {
  state = {
    completed: 0,
    lastTime: Date.now(),
  }

  componentDidMount() {
    this.updateCompleted();
  }

  updateCompleted() {
    const time = Date.now();
    const timePassed = time - this.state.lastTime;
    const completed = this.state.completed + 100 * timePassed / DURATION;
    this.setState({
      lastTime: time,
      completed,
    }, () => setTimeout(() => {
      if (completed < 100) {
        this.updateCompleted();
      }
    }, 100));
  }

  render() {
    const { classes } = this.props;
    const { completed } = this.state;
    if (completed >= 100) {
      return (
        <div className={classes.container}>
          <Typography className={classes.title}>
            Confirm that the power is switching <b>on</b> and <b>off</b>.
          </Typography>
          <Button
            onClick={() => this.props.handleSubmit({})}
            className={classes.button}
            variant='contained'
            color='secondary'
          >
            Confirm
          </Button>
        </div>
      );
    }
    return (
      <div>
        <Typography className={classes.title}>
          Please wait while we switch the power <b>on</b> and <b>off</b>.
        </Typography>
        <LinearProgress
          variant='determinate'
          color='secondary'
          value={completed}
        />
      </div>
    );
  }
}

export default compose(
  withStyles(styles),
)(VerificationRS232);

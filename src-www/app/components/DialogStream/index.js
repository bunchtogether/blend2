// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { navigateStream } from 'containers/App/actions';

const styles = (theme: Object) => ({
  paper: {
    [theme.breakpoints.up('sm')]: {
      minWidth: 500,
    },
  },
  dialogActions: {
    bottom: theme.spacing(1),
    right: theme.spacing(1),
  },
  testStream: {
    marginTop: theme.spacing(1),
  },
});

type Props = {
  classes: ClassesType,
  fullScreen: boolean,
  open: boolean,
  navigateStream: Function,
  onClose: Function,
};

type State = {
  streamUrl: string,
};

export class DialogStream extends React.Component<Props, State> {
  state = {
    streamUrl: '',
  };

  handleClose = () => {
    this.props.onClose();
    this.setState({
      streamUrl: '',
    });
  };

  render() {
    const { open, fullScreen, classes } = this.props;
    const { streamUrl } = this.state;
    return (
      <Dialog
        classes={{ paper: classes.paper }}
        fullScreen={fullScreen}
        open={open}
        onClose={this.handleClose}
        aria-labelledby='responsive-dialog-title'
      >
        <DialogTitle id='responsive-dialog-title'>Display a Stream</DialogTitle>
        <DialogContent>
          <TextField
            label='Stream URL'
            value={streamUrl}
            onChange={(event) => this.setState({ streamUrl: event.target.value })}
            fullWidth
          />
          <Typography className={classes.testStream}>
            or try a <a href="/stream/rtp%3A%2F%2F127.0.0.1%3A13337">test stream</a>
          </Typography>
        </DialogContent>
        <DialogActions className={classes.dialogActions}>
          <Button onClick={this.handleClose} color='primary'>
            Cancel
          </Button>
          <Button
            color='primary'
            variant='contained'
            autoFocus
            disabled={!streamUrl}
            onClick={() => {
              this.props.navigateStream(streamUrl);
              this.handleClose();
            }}
          >
            Go
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const withConnect = connect(
  null,
  (dispatch: Function) => bindActionCreators({ navigateStream }, dispatch),
);

export default compose(
  withMobileDialog(),
  withStyles(styles),
  withConnect,
)(DialogStream);

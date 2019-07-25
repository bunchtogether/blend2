// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { List } from 'immutable';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import moment from 'moment';
import { getLogs, generateLogs } from 'containers/App/actions';
import { availableLogsSelector } from 'containers/App/selectors';

const PROJECT_PROTOCOL = process.env.BLEND_PROTOCOL || window.location.protocol.replace(':', '');
const PROJECT_HOST = process.env.BLEND_HOST || window.location.hostname;
const PROJECT_PORT = process.env.BLEND_PORT || window.location.port;
const BASE_API_URL = `${PROJECT_PROTOCOL}://${PROJECT_HOST}:${PROJECT_PORT}/api/1.0`;

const styles = (theme: Object) => ({
  filesContainer: {
    marginBottom: theme.spacing(2),
  },
  fileContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    height: 35,
    backgroundColor: '#f3f3f3',
  },
  message: {
    marginBottom: theme.spacing(2),
  },
  button: {
    marginRight: theme.spacing(2),
  },
});

type Props = {
  classes: Object,
  availableLogs: List<Object>,
  getLogs: Function,
  generateLogs: Function,
};

type State = {
  disabled: boolean,
};

class SettingsLogs extends React.Component<Props, State> {
  state = {
    disabled: false,
  };

  componentDidMount() {
    this.refreshLogs();
  }

  refreshLogs = () => {
    this.props.getLogs();
  }

  generateLogs = () => {
    this.props.generateLogs();
    this.setState({ disabled: true });
  }

  render() {
    const { classes, availableLogs } = this.props;
    const logFiles = List.isList(availableLogs) ? availableLogs.toJS() : [];
    return (
      <div>
        <div className={classes.filesContainer}>
          {logFiles.map((file) => (
            <div className={classes.fileContainer} key={file.filename}>
              <Typography variant='body2'>{`Filename: ${file.filename}`}</Typography>
              <Typography variant='body2'>{moment(file.timestamp).format('MM/DD/YY, hh:mm:ss a')}</Typography>
              {file.available ? <Typography variant='body2'><a href={`${BASE_API_URL}/logs/download?filename=${file.filename}`}>Download</a></Typography> : null}
            </div>
          ))}
        </div>
        <Typography className={classes.message}>Log files can take 10-15 seconds to be archived and be available to download. Click the refresh button to view most recently generated logs.</Typography>
        <div>
          <Button
            color='secondary'
            variant='contained'
            onClick={this.generateLogs}
            disabled={this.state.disabled}
            className={classes.button}
          >
            Generate Log Archive
          </Button>
          <Button
            color='secondary'
            variant='contained'
            onClick={this.refreshLogs}
            className={classes.button}
          >
            Refresh Log Archives
          </Button>
        </div>
      </div>
    );
  }
}


const withConnect = connect((state: StateType) => ({
  availableLogs: availableLogsSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ getLogs, generateLogs }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsLogs);

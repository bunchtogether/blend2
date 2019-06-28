// @flow

import * as React from 'react';
import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import { Helmet } from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';

const styles = (theme: Object) => ({
  paper: {
    [theme.breakpoints.up('sm')]: {
      minWidth: 800,
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottom: '1px solid grey',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: 520,
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
  },
  content: {
    padding: theme.spacing(2),
    paddingBottom: 0,
    minHeight: 'calc(100% - 68px)',
    maxHeight: 'calc(100% - 68px)',
  },
  borderLeft: {
    borderLeft: '1px solid grey',
  },
  icon: {
    marginLeft: theme.spacing(1),
  },
  menu: {
    height: '100%',
    width: 180,
    padding: 0,
  },
  menuItem: {
    color: '#616161',
  },
  highlight: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    color: 'black',
  },
  buttonContainer: {
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'flex-end',
    height: 68,
  },
  version: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: '#999999',
  },
});

type Props = {
  fullScreen: boolean,
  open: boolean,
  onClose?: Function,
  classes: ClassesType
};

type State = {
  anchorEl: ?Element,
  content: string,
};

const CLUSTER_SSL = 'Cluster SSL';
const SERVER_SSL = 'Server SSL';
const AWS_S3_GATEWAY = 'S3 Gateway';
const AWS_S3_UPLOAD_REFLECTOR = 'S3 Upload Reflector';
const PUBLIC_SERVER_CNAME = 'CNAME';
const PINNING = 'Pinning';
const PURGE = 'Purge';

const SECTIONS = [CLUSTER_SSL, SERVER_SSL, AWS_S3_GATEWAY, AWS_S3_UPLOAD_REFLECTOR, PUBLIC_SERVER_CNAME, PINNING, PURGE];

const BLEND_VERSION = process.env.BLEND_VERSION || 'X.X.X';

export class DialogSettings extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  state = {
    anchorEl: null,
    content: CLUSTER_SSL,
  };

  handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  renderContent() {
    switch (this.state.content) {
      case CLUSTER_SSL:
        return <div />;
      case SERVER_SSL:
        return <div />;
      case AWS_S3_GATEWAY:
        return <div />;
      case AWS_S3_UPLOAD_REFLECTOR:
        return <div />;
      case PUBLIC_SERVER_CNAME:
        return <div />;
      case PINNING:
        return <div />;
      case PURGE:
        return <div />;
      default:
        return null;
    }
  }

  renderMenu() {
    const { classes } = this.props;
    const { content } = this.state;
    return (
      <MenuList className={classes.menu}>
        {SECTIONS.map((section: string) =>
          (<MenuItem
            onClick={() => this.setState({ content: section, anchorEl: null })}
            className={content === section ? classes.highlight : classes.menuItem}
            key={section}
          >
            {section}
          </MenuItem>),
        )}
      </MenuList>
    );
  }

  renderPopover() {
    const { classes } = this.props;
    const { anchorEl, content } = this.state;
    return (
      <React.Fragment>
        <Button
          color='primary'
          variant='outlined'
          onClick={(event) => this.setState({ anchorEl: event.currentTarget })}
        >
          {content}
          <KeyboardArrowDownIcon className={classes.icon} />
        </Button>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => this.setState({ anchorEl: null })}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          {this.renderMenu()}
        </Popover>
      </React.Fragment>
    );
  }

  render() {
    const { fullScreen } = this.props;
    const { classes } = this.props;
    return (
      <Dialog
        classes={{
          paper: classes.paper,
        }}
        fullScreen={fullScreen}
        open={this.props.open}
        onClose={this.handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <Helmet>
          <title>Settings</title>
        </Helmet>
        <div className={classes.header}>
          <Typography variant='h5'>Settings</Typography>
          {fullScreen ? null : <div className={classes.version}>v{BLEND_VERSION}</div>}
          {fullScreen ? this.renderPopover() : null}
        </div>
        <div className={classes.container}>
          {!fullScreen ? this.renderMenu() : null}
          <div className={classes.contentContainer}>
            <div className={`${classes.content} ${!fullScreen ? classes.borderLeft : ''}`}>
              {this.renderContent()}
            </div>
            <div className={`${classes.buttonContainer} ${!fullScreen ? classes.borderLeft : ''}`}>
              <Button onClick={this.handleClose} color="primary">
                Done
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default withMobileDialog()(withStyles(styles)(DialogSettings));

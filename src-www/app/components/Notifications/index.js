// @flow

/**
*
* Notifications
*
*/

import type { OrderedSet } from 'immutable';
import { findDOMNode } from 'react-dom';
import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { connect } from 'react-redux';

const styles = (theme:Object) => ({
  snackbar: {
    zIndex: theme.zIndex.snackbar,
    position: 'fixed',
    width: 'auto',
    maxWidth: `calc(100% - ${theme.spacing(4)}px)`,
    right: theme.spacing(2),
    bottom: theme.spacing(2),
    opacity: 0,
    transition: 'transform 200ms, opacity 200ms',
    transform: 'translateY(100%)',
    backgroundColor: theme.palette.secondary.main,
  },
  snackbarActive: {
    opacity: 1,
  },
  snackbarIn: {
    opacity: 0,
  },
  snackbarOut: {
    opacity: 0,
  },
});

type Props = {
  theme: Object,
  classes: ClassesType,
  maxNotifications: number,
  duration: number,
  notifications: OrderedSet<NotificationType>
};

type State = {
  notificationStyles: {[string]: Object},
  notifications: OrderedSet<NotificationType>
};

class Notifications extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  static defaultProps = {
    duration: 10000,
    maxNotifications: 5,
  }

  constructor(props:Props) {
    super(props);
    this.state = {
      notificationStyles: {},
      notifications: props.notifications,
    };
    this.elements = {};
  }

  componentDidMount() {
    this.state.notifications.forEach((notification) => this.fadeIn(notification));
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.notifications !== this.props.notifications) {
      const activeNotifications = [];
      for (const notification of nextProps.notifications) {
        const id = notification.get('id');
        if (!this.props.notifications.has(notification)) {
          this.fadeIn(notification);
          activeNotifications.push(notification);
        } else if (this.state[id]) {
          activeNotifications.push(notification);
        }
      }
      for (let i = 0; i < activeNotifications.length - nextProps.maxNotifications; i += 1) {
        const id = activeNotifications[i].get('id');
        const onClose = activeNotifications[i].get('onClose');
        if (!onClose) {
          this.fadeOut(id);
        }
      }
      this.setState({
        notifications: nextProps.notifications,
      });
    }
  }

  adjustHeight = () => {
    const notifications = this.props.notifications.toJS().filter(({ id }) => !!this.state[id]);
    const notificationStyles = {};
    let offset = 0;
    for (let i = notifications.length - 1; i >= 0; i -= 1) {
      const { id } = notifications[i];
      if (!this.elements[id]) {
        continue;
      }
      const e:any = findDOMNode(this.elements[id]); // eslint-disable-line react/no-find-dom-node
      if (e && e.offsetHeight) {
        notificationStyles[id] = { transform: `translateY(-${offset}px)` };
        offset = offset + e.offsetHeight + 2 * this.props.theme.spacing(1);
      }
    }
    this.setState({
      notificationStyles,
    });
  }

  fadeIn = (notification:NotificationType) => {
    const id = notification.get('id');
    const onClose = notification.get('onClose');
    this.setState({
      [id]: 'snackbarIn',
    });
    setTimeout(() => {
      this.setState({
        [id]: 'snackbarActive',
      });
      this.adjustHeight();
    }, 20);
    // If the notification has an onClose property, wait for it to
    // trigger to automatically close the notification.
    if (onClose) {
      onClose(() => {
        this.fadeOut(id);
      });
    } else {
      setTimeout(() => {
        this.fadeOut(id);
      }, this.props.duration);
    }
  };

  fadeOut = (id:string) => {
    this.setState({
      [id]: 'snackbarOut',
    });
    setTimeout(() => {
      this.setState({
        [id]: null,
      });
      delete this.elements[id];
      this.adjustHeight();
    }, 250);
  };

  handleClose = (id) => {
    this.fadeOut(id);
  };

  elements: {[string]:?Element}

  render() {
    const notifications = this.props.notifications.toJS().filter(({ id }) => !!this.state[id]);
    const { classes } = this.props;
    const { notificationStyles } = this.state;
    return (
      <React.Fragment>
        {notifications.map(({ message, id }) => (<SnackbarContent
          className={`${classes.snackbar} ${classes[this.state[id]]}`}
          style={notificationStyles[id]}
          message={message}
          key={id}
          ref={(e) => { this.elements[id] = e; }}
          action={[
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              onClick={() => this.handleClose(id)}
            >
              <CloseIcon />
            </IconButton>,
          ]}
        />))}
      </React.Fragment>
    );
  }
}

export default connect((state:StateType) => ({
  notifications: state.getIn(['app', 'notifications']),
}), (dispatch: Function) => ({ dispatch }))(withStyles(styles, { withTheme: true })(Notifications));

// @flow

/**
*
* NavigationBase
*
*/

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';
import Drawer from '@material-ui/core/Drawer';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import { emphasize } from '@material-ui/core/styles/colorManipulator';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { navigationVisibleSelector } from 'containers/App/selectors';
import { hideNavigation } from 'containers/App/actions';


const styles = (theme:Object) => ({
  drawerHeader: {
    backgroundColor: emphasize(theme.palette.primary.main, 0.025),
    color: theme.palette.primary.contrastText,
    height: theme.spacing(7),
    width: theme.navigationWidth,
    position: 'fixed',
    top: 0,
    zIndex: theme.zIndex.appBar + 1,
    [theme.breakpoints.up('sm')]: {
      height: theme.spacing(8),
    },
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerDocked: {
    height: '100vh',
  },
  drawerPaper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    flexDirection: 'column',
    width: theme.navigationWidth,
    overflowX: 'hidden',
    borderRight: 'none',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    [theme.breakpoints.up('md')]: {
      width: theme.navigationWidth,
      position: 'relative',
      height: '100vh',
    },
    paddingTop: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      paddingTop: theme.spacing(8),
    },
  },
  itemIcon: {},
  footer: {
  },
});

type Props = {
  navigationVisible: boolean,
  hideNavigation: Function,
  classes: ClassesType,
  theme: ThemeType,
  header?: React.Node,
  footer?: React.Node,
  children?: React.Node,
};

type State = {};

class NavigationBase extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { classes, theme } = this.props;

    const drawer = (
      <React.Fragment>
        <Paper square elevation={4} classes={{ root: classes.drawerHeader }}>{this.props.header}</Paper>
        <List disablePadding>
          {this.props.children}
        </List>
        <div className={classes.footer}>{this.props.footer}</div>
      </React.Fragment>
    );

    return (<React.Fragment>
      <Hidden mdUp>
        <Drawer
          type="temporary"
          anchor={theme.direction === 'rtl' ? 'right' : 'left'}
          open={this.props.navigationVisible}
          classes={{
            paper: classes.drawerPaper,
          }}
          onClose={this.props.hideNavigation}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </Drawer>
      </Hidden>
      <Hidden smDown implementation="css">
        <Paper square elevation={0} classes={{ root: classes.drawerPaper }} >
          {drawer}
        </Paper>
      </Hidden>
    </React.Fragment>);
  }
}

export default connect(
  (state: StateType): Object => ({
    navigationVisible: navigationVisibleSelector(state),
  }),
  (dispatch: Function): Object => bindActionCreators({ hideNavigation }, dispatch),
)(withStyles(styles, { withTheme: true })(NavigationBase));

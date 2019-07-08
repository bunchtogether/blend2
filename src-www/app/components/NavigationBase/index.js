// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';
import Drawer from '@material-ui/core/Drawer';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { navigationVisibleSelector } from 'containers/App/selectors';
import { hideNavigation } from 'containers/App/actions';


const styles = (theme:Object) => ({
  drawerHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    height: theme.spacing(7),
    width: theme.navigationWidth,
    position: 'fixed',
    top: 0,
    zIndex: theme.zIndex.appBar,
    [theme.breakpoints.up('sm')]: {
      height: theme.spacing(8),
    },
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerDocked: {
    height: `calc(100vh - ${theme.spacing(8)}px)`,
  },
  drawerPaper: {
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    flexDirection: 'column',
    width: theme.navigationWidth,
    overflowX: 'hidden',
    borderRight: 'none',
    height: '100vh',
    [theme.breakpoints.up('md')]: {
      width: theme.navigationWidth,
      position: 'relative',
    },
    paddingTop: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      paddingTop: theme.spacing(10),
    },
  },
  itemIcon: {},
  footer: {
  },
  logoContainer: {
    width: '90%',
    height: '90%',
  },
  listBase: {
    // IE11 List fix
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

export class NavigationBase extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  state: State;
  render() {
    const { classes, theme } = this.props;

    const drawer = (
      <React.Fragment>
        <div>
          {/* Extra div for IE11 Flex issue */}
          <Paper square elevation={0} classes={{ root: classes.drawerHeader }}>
            <div className={classes.logoContainer}>{this.props.header}</div>
          </Paper>
          <List
            disablePadding
            className={classes.listBase}
          >
            {this.props.children}
          </List>
        </div>
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

const withConnect = connect((state: StateType): Object => ({
  navigationVisible: navigationVisibleSelector(state),
}), (dispatch: Function) => bindActionCreators({ hideNavigation }, dispatch));

export default compose(
  withConnect,
  withStyles(styles, { withTheme: true }),
)(NavigationBase);

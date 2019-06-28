// @flow

/**
*
* Header
*
*/

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import Hidden from '@material-ui/core/Hidden';
import { darken, lighten } from '@material-ui/core/styles/colorManipulator';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { searchQuerySelector, navigationVisibleSelector } from 'containers/App/selectors';
import { search, hideNavigation, showNavigation } from 'containers/App/actions';

const styles = (theme:Object) => ({
  appBar: {
    position: 'absolute',
    marginLeft: theme.navigationWidth,
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - ${theme.navigationWidth}px)`,
    },
    height: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      height: theme.spacing(8),
    },
  },
  appBarColorDefault: {
    backgroundColor: '#FFF',
  },
  searchIcon: {
    color: darken(theme.palette.background.default, 0.3),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  buttonContainer: {
    transition: 'flex 200ms ease-in-out',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  searchForm: {
    flex: 0,
    minWidth: '150px',
    transition: 'flex 200ms ease-in-out, background-color 200ms ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: darken(theme.palette.background.default, 0.02),
    height: theme.spacing(3.5),
    [theme.breakpoints.up('sm')]: {
      height: theme.spacing(4),
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: theme.spacing(2),
    },
  },
  searchFormActive: {
    backgroundColor: darken(theme.palette.background.default, 0.05),
    flex: 2,
  },
  searchInput: {
    width: '100%',
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    fontFamily: theme.typography.body1.fontFamily,
    letterSpacing: theme.typography.body1.letterSpacing,
    lineHeight: theme.typography.body1.lineHeight,
    marginLeft: theme.typography.body1.marginLeft,
    color: lighten(theme.palette.primary.main, 0.2),
    outlineWidth: 0,
    border: 'none',
    backgroundColor: 'transparent !important',
  },

});

type Props = {
  classes: ClassesType,
  navigationVisible: boolean,
  children?: React.Node,
  showSearch: boolean,
  searchQuery: string,
  search: Function,
  hideNavigation: Function,
  showNavigation: Function
};

type State = {
  searchActive: boolean
};

class Header extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  static defaultProps = {
    showSearch: true,
  }

  constructor(props:Props) {
    super(props);
    this.state = {
      searchActive: false,
    };
  }

  handleSearchFocus = () => {
    this.setState({ searchActive: true });
  }

  handleSearchBlur = () => {
    this.setState({ searchActive: false });
  }

  handleSearchChange = (event: Object) => {
    this.props.search(event.target.value);
  }

  searchElement: HTMLInputElement;

  render() {
    const { classes } = this.props;
    const onClick = this.props.navigationVisible ? this.props.hideNavigation : this.props.showNavigation;
    return (
      <AppBar
        color="default"
        classes={{
          root: classes.appBar,
          colorDefault: classes.appBarColorDefault,
        }}
      >
        <Toolbar>
          <Hidden mdUp>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={onClick}
              className={classes.navIconHide}
            >
              <MenuIcon />
            </IconButton>
          </Hidden>
          {this.props.showSearch ? <form
            className={this.state.searchActive ? `${classes.searchForm} ${classes.searchFormActive}` : classes.searchForm}
            onSubmit={(e) => { e.preventDefault(); }}
          >
            <SearchIcon className={classes.searchIcon} />
            <input
              className={classes.searchInput}
              ref={(e) => {
                if (e) {
                  this.searchElement = e;
                }
              }}
              type="text"
              name="search"
              id="search"
              value={this.props.searchQuery}
              onFocus={this.handleSearchFocus}
              onBlur={this.handleSearchBlur}
              onChange={this.handleSearchChange}
            />
          </form> : null}
          <div className={classes.buttonContainer}>
            {this.props.children}
          </div>
        </Toolbar>
      </AppBar>
    );
  }
}

export default connect(
  (state: StateType): Object => ({
    searchQuery: searchQuerySelector(state),
    navigationVisible: navigationVisibleSelector(state),
  }),
  (dispatch: Function): Object => bindActionCreators({ search, hideNavigation, showNavigation }, dispatch),
)(withStyles(styles)(Header));


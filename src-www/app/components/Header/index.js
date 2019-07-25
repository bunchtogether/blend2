// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import Hidden from '@material-ui/core/Hidden';
import { emphasize, darken, lighten } from '@material-ui/core/styles/colorManipulator';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { searchQuerySelector, navigationVisibleSelector } from 'containers/App/selectors';
import { search, hideNavigation, showNavigation } from 'containers/App/actions';

const styles = (theme:Object) => ({
  appBar: {
    position: 'absolute',
    [theme.breakpoints.up('md')]: {
      paddingLeft: theme.navigationWidth,
      width: '100%',
    },
    height: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      height: theme.spacing(8),
    },
  },
  navIconHide: {
    marginRight: theme.spacing(1),
  },
  toolbarRoot: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    justifyContent: 'flex-end',
    [theme.breakpoints.down('sm')]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
      justifyContent: 'space-between',
    },
  },
  searchIcon: {
    color: theme.palette.primary.main.contrastText,
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing(1),
    },
    marginLeft: theme.spacing(1),
  },
  buttonContainer: {
    transition: 'flex 200ms ease-in-out',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  searchForm: {
    maxWidth: 250,
    flex: 100,
    transition: 'max-width 200ms ease-in-out, background-color 200ms ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: theme.spacing(3.5),
    backgroundColor: emphasize(theme.palette.primary.main, 0.15),
    [theme.breakpoints.up('sm')]: {
      height: theme.spacing(4),
    },
    [theme.breakpoints.down('xs')]: {
      marginLeft: theme.spacing(2),
    },
    marginRight: theme.spacing(2),
  },
  searchFormActive: {
    maxWidth: '100%',
    backgroundColor: darken(theme.palette.background.default, 0.1),
    '& $searchIcon': {
      color: theme.palette.primary.main,
    },
  },
  searchInput: {
    width: '100%',
    fontSize: theme.typography.body1.fontSize,
    fontWeight: theme.typography.body1.fontWeight,
    fontFamily: theme.typography.body1.fontFamily,
    letterSpacing: theme.typography.body1.letterSpacing,
    lineHeight: theme.typography.body1.lineHeight,
    marginLeft: theme.typography.body1.marginLeft,
    color: lighten(theme.palette.primary.main, 0.5),
    outlineWidth: 0,
    border: 'none',
    backgroundColor: 'transparent !important',
  },
  searchPlaceholder: {
    flex: 1,
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

export class Header extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  static defaultProps = {
    showSearch: true,
  }

  constructor(props:Props) {
    super(props);
    this.state = {
      searchActive: false,
    };
    this.toolbarClasses = { root: props.classes.toolbarRoot };
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
  toolbarClasses: Object;

  render() {
    const { classes } = this.props;
    const onClick = this.props.navigationVisible ? this.props.hideNavigation : this.props.showNavigation;
    return (
      <AppBar
        color="primary"
        classes={{
          root: classes.appBar,
        }}
      >
        <Toolbar classes={this.toolbarClasses}>
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
              autoComplete='off'
            />
          </form> : null }
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

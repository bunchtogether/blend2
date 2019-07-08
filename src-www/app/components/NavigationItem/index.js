// @flow

import * as React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

const styles = (theme:Object) => ({
  listItemTextPrimary: {
    padding: '0 16px',
  },
  listItem: {

  },
  listItemButton: {
    [theme.breakpoints.up('md')]: {
      borderTopRightRadius: theme.spacing(1),
      borderBottomRightRadius: theme.spacing(1),
    },
  },
  listItemActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  listItemIcon: {
    height: 40,
    width: 40,
    minWidth: 40,
    borderRadius: '50%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemIconWithColor: {
    color: '#FFF',
    height: 40,
    width: 40,
    minWidth: 40,
    borderRadius: '50%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemDefault: {
    paddingTop: 0,
    paddingBottom: 0,
    height: theme.spacing(8),
  },
});

type Props = {
  classes: ClassesType,
  icon: React.Node,
  label: string,
  dispatch: Function,
  onClick?: Function,
  action?: Function,
  pathnames?: Array<string>,
  pathname: string,
  color?: string
};

function NavigationItem(props:Props) {
  const { dispatch, action, classes, pathnames, pathname, color } = props;
  const listItem = pathnames && pathnames.some((path: string) => pathname.indexOf(path) !== -1) ? classes.listItemActive : classes.listItem;

  const onClick = props.onClick || (action ? () => dispatch(action()) : () => {});

  return (
    <ListItem button classes={{ root: `${listItem} ${classes.listItemDefault}`, button: classes.listItemButton }} onClick={onClick}>
      <ListItemIcon classes={{ root: color ? classes.listItemIconWithColor : classes.listItemIcon }} style={color ? { backgroundColor: color } : null}>
        {props.icon}
      </ListItemIcon>
      <ListItemText classes={{ primary: classes.listItemTextPrimary }} primary={props.label} />
    </ListItem>
  );
}

export default connect((state: StateType): Object => ({
  pathname: state.getIn(['router', 'location', 'pathname']),
}), (dispatch) => ({ dispatch }))(withStyles(styles)(NavigationItem));

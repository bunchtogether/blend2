// @flow

/**
*
* NavigationItem
*
*/

import * as React from 'react';
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { emphasize } from '@material-ui/core/styles/colorManipulator';
import { connect } from 'react-redux';

const styles = (theme:Object) => ({
  listItemTextPrimary: {
    color: theme.palette.primary.contrastText,
    fontWeight: '500',
    fontSize: 18,
  },
  listItem: {

  },
  listItemActive: {
    backgroundColor: emphasize(theme.palette.primary.main, 0.15),
  },
  listItemIcon: {
    color: theme.palette.primary.contrastText,
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
  action?: Function,
  onClick?: Function,
  pathnames?: Array<string>,
  pathname: string
};

function NavigationItem(props:Props) {
  const { dispatch, action, classes, pathnames, pathname } = props;
  const listItem = pathnames && pathnames.indexOf(pathname) !== -1 ? classes.listItemActive : classes.listItem;

  const onClick = props.onClick || (action ? () => dispatch(action()) : () => {});

  return (
    <ListItem button classes={{ root: `${listItem} ${classes.listItemDefault}`, button: classes.listItemButton }} onClick={onClick}>
      <ListItemIcon classes={{ root: classes.listItemIcon }}>
        {props.icon}
      </ListItemIcon>
      <ListItemText classes={{ primary: classes.listItemTextPrimary }} primary={props.label} />
    </ListItem>
  );
}

export default connect((state: StateType): Object => ({
  pathname: state.getIn(['route', 'location', 'pathname']),
}))(withStyles(styles)(NavigationItem));

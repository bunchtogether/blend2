// @flow

/**
*
* Content
*
*/

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = (theme:Object) => ({ // eslint-disable-line no-unused-vars
  root: {
    position: 'absolute',
    top: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      top: theme.spacing(8),
    },
    left: 0,
    [theme.breakpoints.up('md')]: {
      left: theme.navigationWidth,
    },
    bottom: 0,
    right: 0,
    padding: theme.spacing(2),
    overflowY: 'auto',
  },
});

type Props = {
  classes: ClassesType,
  children?: React.Node,
};

function Content(props:Props) {
  const { classes } = props;
  return (
    <div className={classes.root}>
      {props.children}
    </div>
  );
}

export default withStyles(styles)(Content);

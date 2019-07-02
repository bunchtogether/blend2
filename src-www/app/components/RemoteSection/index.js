// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { grey } from '@material-ui/core/colors';

const styles = (theme: Object) => ({
  container: {
    marginBottom: theme.spacing(4),
  },
  icon: {
    height: 40,
  },
  title: {
    fontWeight: 700,
    fontSize: 18,
    width: 70,
  },
  value: {
    fontSize: 18,
    color: grey[700],
    width: 70,
  },
});

type Props = {
  classes: ClassesType,
  icon: React.Node,
  title: string,
  value: string,
  children: React.Node,
};


class RemoteVolume extends React.PureComponent<Props> {
  render() {
    const { classes, icon, title, value, children } = this.props;
    return (
      <Grid container spacing={2} classes={{ container: classes.container }} alignItems='center' justify='center'>
        <Grid item className={classes.icon}>
          {icon}
        </Grid>
        <Grid item>
          <Typography className={classes.title}>{title}</Typography>
        </Grid>
        <Grid item>
          <Typography className={classes.value}>{value}</Typography>
        </Grid>
        <Grid item xs={8}>
          {children}
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(RemoteVolume);

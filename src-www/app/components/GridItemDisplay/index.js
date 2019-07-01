// @flow
/* eslint-disable global-require */

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import ButtonBase from '@material-ui/core/ButtonBase';

const styles = (theme: Object) => ({
  container: {
    width: 100,
    height: 80,
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type Props = {
  classes: Object,
  type: string,
  onClick: Function,
};

class GridItemDisplay extends React.PureComponent<Props> {
  render() {
    const { classes, type } = this.props;
    return (
      <Grid item>
        <ButtonBase onClick={() => this.props.onClick()}>
          <Paper className={classes.container}>
            <img src={require(`../../static/${type}.svg`)} alt={type} />
          </Paper>
        </ButtonBase>
      </Grid>
    );
  }
}

export default withStyles(styles)(GridItemDisplay);

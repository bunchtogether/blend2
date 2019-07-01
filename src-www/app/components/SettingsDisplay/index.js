// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import GridItemDisplay from 'components/GridItemDisplay';
import { pairDisplay } from 'containers/App/actions';

const styles = (theme: Object) => ({
  title: {
    marginBottom: theme.spacing(2),
  },
});

type Props = {
  classes: Object,
  pairDisplay: Function,
};

const DISPLAYS = ['vizio'];

class SettingsDisplay extends React.PureComponent<Props> {
  render() {
    const { classes } = this.props;
    return (
      <div>
        <Typography className={classes.title} variant='h5'>Pair new display</Typography>
        <Grid container spacing={2}>
          {DISPLAYS.map((type: string) => (
            <GridItemDisplay
              key={type}
              type={type}
              onClick={() => this.props.pairDisplay(type)}
            />
          ))}
        </Grid>
      </div>
    );
  }
}


const withConnect = connect(null, (dispatch: Function): Object => bindActionCreators({ pairDisplay }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(SettingsDisplay);

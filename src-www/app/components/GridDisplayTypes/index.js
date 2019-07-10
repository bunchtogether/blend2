// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import GridItemDisplayType from 'components/GridItemDisplayType';
import { discoverDevices } from 'containers/App/actions';
import * as constants from '../../constants';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
  },
  subtitle: {
    marginBottom: theme.spacing(2),
  },
  button: {
    marginTop: theme.spacing(1),
  },
});

type Props = {
  classes: Object,
  discoverDevices: Function,
  onClick?: Function,
};

type State = {
  displayType: ?string,
};

const DISPLAYS = [constants.TYPE_SAMSUNG, constants.TYPE_VIZIO];

class GridDisplayTypes extends React.Component<Props, State> {
  state = {
    displayType: null,
  };

  handleSelect(type: string) {
    if (this.props.onClick) {
      this.props.onClick();
    }
    this.props.discoverDevices(type);
  }

  render() {
    const { classes } = this.props;
    const { displayType } = this.state;
    if (displayType === constants.TYPE_SAMSUNG) {
      return (
        <div className={classes.container}>
          <Typography>Please make sure the cable is connected to <b>EX-LINK</b> port on you Samsung device</Typography>
          <Button
            className={classes.button}
            variant='contained'
            color='secondary'
            onClick={() => this.handleSelect(constants.TYPE_SAMSUNG)}
          >
            Continue
          </Button>
        </div>
      );
    }

    return (
      <div>
        <Typography className={classes.subtitle}>Select display type</Typography>
        <Grid container spacing={2}>
          {DISPLAYS.map((type: string) => (
            <GridItemDisplayType
              key={type}
              type={type}
              onClick={() => {
                if (type === constants.TYPE_VIZIO) {
                  this.handleSelect(type);
                } else {
                  this.setState({ displayType: type });
                }
              }}
            />
          ))}
        </Grid>
      </div>
    );
  }
}


const withConnect = connect(null, (dispatch: Function): Object => bindActionCreators({ discoverDevices }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(GridDisplayTypes);

// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import GridItemDisplayType from 'components/GridItemDisplayType';
import { discoverDevices } from 'containers/App/actions';

const styles = () => ({
});

type Props = {
  discoverDevices: Function,
  onClick?: Function,
};

const DISPLAYS = ['vizio'];

class GridDisplayTypes extends React.PureComponent<Props> {
  render() {
    return (
      <Grid container spacing={2}>
        {DISPLAYS.map((type: string) => (
          <GridItemDisplayType
            key={type}
            type={type}
            onClick={() => {
              if (this.props.onClick) {
                this.props.onClick();
              }
              this.props.discoverDevices(type);
            }}
          />
        ))}
      </Grid>
    );
  }
}


const withConnect = connect(null, (dispatch: Function): Object => bindActionCreators({ discoverDevices }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(GridDisplayTypes);

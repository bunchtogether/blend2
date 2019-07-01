// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { compose, bindActionCreators } from 'redux';
import Navigation from 'components/Navigation';
import Content from 'components/Content';
import Header from 'components/Header';
import RemoteVolume from 'components/RemoteVolume';

const styles = (theme: Object) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
    paddingTop: theme.spacing(8),
    paddingRight: theme.spacing(8),
    paddingLeft: theme.spacing(8),
  },
});

type Props = {
  classes: ClassesType,
};

type State = {
};

export class Stream extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { classes } = this.props;
    return (
      <React.Fragment>
        <Helmet>
          <title>Blend</title>
        </Helmet>
        <Header showSearch={false} />
        <Navigation />
        <Content>
          <div className={classes.container}>
            <RemoteVolume />
          </div>
        </Content>
      </React.Fragment>
    );
  }
}

const withConnect = connect(null, (dispatch: Function): Object => bindActionCreators({ }, dispatch));

export default compose(
  withStyles(styles, { withTheme: true }),
  withConnect,
)(Stream);

// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { compose, bindActionCreators } from 'redux';
import Navigation from 'components/Navigation';
import Content from 'components/Content';
import Header from 'components/Header';

const styles = () => ({ // eslint-disable-line no-unused-vars
});

type Props = {
};

type State = {
};

export class Home extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <React.Fragment>
        <Helmet>
          <title>Blend</title>
        </Helmet>
        <Header showSearch={false} />
        <Navigation />
        <Content>
          <div>HOME</div>
        </Content>
      </React.Fragment>
    );
  }
}

const withConnect = connect(null, (dispatch: Function): Object => bindActionCreators({ }, dispatch));

export default compose(
  withStyles(styles, { withTheme: true }),
  withConnect,
)(Home);

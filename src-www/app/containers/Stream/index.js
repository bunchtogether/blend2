// @flow

import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { compose, bindActionCreators } from 'redux';
import Navigation from 'components/Navigation';
import Content from 'components/Content';
import Header from 'components/Header';
import Player from 'components/Player';

const styles = () => ({
});

type Props = {
  match: Object,
};

type State = {
};

export class Stream extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { match: { params: { url } } } = this.props;
    return (
      <React.Fragment>
        <Helmet>
          <title>Blend</title>
        </Helmet>
        <Header showSearch={false} />
        <Navigation />
        <Content>
          {url ? <Player /> : null}
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

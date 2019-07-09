// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import ClosedCaptionIcon from '@material-ui/icons/ClosedCaption';
import RemoteSection from 'components/RemoteSection';
import { toggleCC } from 'containers/App/actions';

const styles = () => ({
});

type Props = {
  toggleCC: Function,
  mute: boolean, // eslint-disable-line react/no-unused-prop-types
};

class RemoteCC extends React.PureComponent<Props> {
  render() {
    return (
      <RemoteSection
        icon={<ClosedCaptionIcon />}
        title='Closed Caption'
      >
        <Fab
          color='secondary'
          onClick={() => this.props.toggleCC()}
        >
          <ClosedCaptionIcon />
        </Fab>
      </RemoteSection>
    );
  }
}

const withConnect = connect(null, (dispatch: Function): Object => bindActionCreators({ toggleCC }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(RemoteCC);

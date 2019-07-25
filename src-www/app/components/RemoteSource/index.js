// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import InputIcon from '@material-ui/icons/Input';
import RemoteSection from 'components/RemoteSection';
import AutoComplete from 'components/AutoComplete';
import { sourcesSelector } from 'containers/App/selectors';
import { setSource } from 'containers/App/actions';

const styles = () => ({
});

type Props = {
  setSource: Function,
  sources: Array<string>,
};

type State = {
  value: string,
};

class RemoteSource extends React.Component<Props, State> {
  state = {
    value: '',
  }

  render() {
    const { sources } = this.props;
    const { value } = this.state;
    return (
      <RemoteSection
        icon={<InputIcon />}
        title='Source:'
        value={value}
      >
        <AutoComplete
          placeholder='Select source to switch'
          data={(sources || []).map((source: string) => ({
            label: source,
            value: source,
          }))}
          clearAfterSelect
          onSelect={(source: string) => {
            this.setState({ value: source });
            this.props.setSource(source);
          }}
        />
      </RemoteSection>
    );
  }
}

const withConnect = connect((state: StateType) => ({
  sources: sourcesSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ setSource }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(RemoteSource);

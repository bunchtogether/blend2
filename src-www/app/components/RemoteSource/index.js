// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { compose, bindActionCreators } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import InputIcon from '@material-ui/icons/Input';
import RemoteSection from 'components/RemoteSection';
import { sourceSelector, sourcesSelector } from 'containers/App/selectors';
import { setSource } from 'containers/App/actions';

const styles = (theme: Object) => ({
  sourcesContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  button: {
    marginRight: theme.spacing(2),
  },
});

type Props = {
  classes: Object,
  setSource: Function,
  source: string, // eslint-disable-line react/no-unused-prop-types
  sources: Array<string>,
};

type State = {
  sourceProp: string,
  source: string,
};

class RemoteSource extends React.Component<Props, State> {
  static getDerivedStateFromProps(props, state) {
    if (props.source !== state.sourceProp) {
      return { source: props.source, sourceProp: props.source };
    }
    return null;
  }

  state = {
    sourceProp: 'tv',
    source: 'tv',
  }

  render() {
    const { classes, sources } = this.props;
    const { source } = this.state;
    return (
      <RemoteSection
        icon={<InputIcon />}
        title='Source:'
        value={source}
      >
        <div className={classes.sourcesContainer}>
          {(sources || []).map((src: string) => (
            <Button
              key={src}
              color='secondary'
              variant='outlined'
              className={classes.button}
              onClick={() => {
                this.setState({ source: src });
                this.props.setSource(src);
              }}
            >
              {src}
            </Button>
          ))}
        </div>
      </RemoteSection>
    );
  }
}

const withConnect = connect((state: StateType) => ({
  source: sourceSelector(state),
  sources: sourcesSelector(state),
}), (dispatch: Function): Object => bindActionCreators({ setSource }, dispatch));

export default compose(
  withStyles(styles),
  withConnect,
)(RemoteSource);

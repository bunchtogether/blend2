// @flow

import * as React from 'react';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import { withStyles } from '@material-ui/core/styles';
import Grow from '@material-ui/core/Grow';
import Autosuggest from 'react-autosuggest';

const styles = (theme: Object) => ({  // eslint-disable-line
  container: {
    position: 'relative',
  },
  suggestionsContainerOpen: {
    position: 'relative',
    zIndex: 20,
    maxHeight: 230,
    overflow: 'auto',
  },
  suggestion: {
    display: 'block',
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
});

type Props = {
  classes: ClassesType,
  suggestions: Array<*>,
  handleSuggestionsFetchRequested: Function,
  getSuggestionValue: Function,
  renderSuggestion: Function,
  handleSuggestionSelected: Function,
  renderInput: Function,
  placeholder?: string,
  label?: string,
  className?: string,
  highlightFirstSuggestion?: boolean,
  alwaysRenderSuggestions?: boolean,
};

type State = {
  value: string,
  anchorEl: ?Object,
};

export class AutoCompleteBase extends React.PureComponent<Props, State> { // eslint-disable-line react/prefer-stateless-function
  constructor(props: Props) {
    super(props);
    this.state = {
      value: '',
      anchorEl: null,
    };
  }

  getSuggestionValue = (suggestion: string) => suggestion

  handleChange = (event: Event, { newValue }: Object) => {
    this.setState({
      value: newValue,
    });
  };

  handleSuggestionSelected = (event: Event, { suggestion }: Object) => {
    this.props.handleSuggestionSelected(event, { suggestion });
    this.setState({ value: '' });
  }

  popperNode: any;

  renderInput = (inputProps: Object) => {
    // $FlowFixMe ignore input ref
    const { inputRef = () => { }, ref, ...other } = inputProps;
    return (
      <TextField
        fullWidth
        InputProps={{
          inputRef: (node) => {
            ref(node);
            inputRef(node);
          },
        }}
        {...other}
      />
    );
  }

  renderSuggestionsContainer = (options: Object) => {
    const { containerProps, children } = options;
    return (
      <Popper
        open={Boolean(children)}
        anchorEl={this.popperNode}
        placement="bottom-start"
        modifiers={{
          flip: {
            enabled: true,
          },
        }}
        transition
        style={{
          zIndex: 2001,
        }}
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            id="menu-list-grow"
          >
            <Paper
              {...containerProps}
              square
              style={{ minWidth: this.popperNode ? this.popperNode.clientWidth : null }}
            >
              {children}
            </Paper>
          </Grow>
        )}
      </Popper>
    );
  }

  render() {
    const { classes } = this.props;
    return (
      <Autosuggest
        theme={{
          suggestionsContainerOpen: classes.suggestionsContainerOpen,
          suggestionsList: classes.suggestionsList,
          suggestion: classes.suggestion,
        }}
        renderInputComponent={this.props.renderInput || this.renderInput}
        suggestions={this.props.suggestions}
        onSuggestionsFetchRequested={this.props.handleSuggestionsFetchRequested}
        onSuggestionsClearRequested={() => { }}
        renderSuggestionsContainer={this.renderSuggestionsContainer}
        getSuggestionValue={this.props.getSuggestionValue || this.getSuggestionValue}
        renderSuggestion={this.props.renderSuggestion}
        onSuggestionSelected={this.handleSuggestionSelected}
        shouldRenderSuggestions={() => true}
        focusInputOnSuggestionClick={false}
        highlightFirstSuggestion={this.props.highlightFirstSuggestion}
        alwaysRenderSuggestions={this.props.alwaysRenderSuggestions}
        inputProps={{
          placeholder: this.props.placeholder,
          label: this.props.label,
          value: this.state.value,
          onChange: this.handleChange,
          inputRef: (node) => {
            this.popperNode = node;
          },
        }}
      />
    );
  }
}

export default withStyles(styles, { withTheme: true })(AutoCompleteBase);

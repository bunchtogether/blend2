// @flow

import * as React from 'react';
import TextField from '@material-ui/core/TextField';
import AutoCompleteBase from 'components/AutoCompleteBase';
import MenuItem from '@material-ui/core/MenuItem';
import Fuse from 'fuse.js';

type SuggestionType = {
  label: string,
  value: *,
};

type Props = {
  data: Array<SuggestionType>,
  placeholder?: string,
  onSelect: Function,
  options?: Object,
  onClick?: Function,
  onChange?: Function,
  renderSuggestion?: Function,
  defaultValue?: string,
  limit?: number,
  disabled?: boolean,
  className?: string,
  error?: boolean,
  helperText?: string,
  leftAdornment?: React.Node,
  label?: string,
  clearAfterSelect?: boolean,
  inputClass?: string,
  onDelete?: Function,
  variant?: string,
};

type State = {
  value: string,
  prevValue: string,
  fuse: any,
  suggestions: Array<SuggestionType>,
};

const defaultOptions = {
  shouldSort: true,
  threshold: 0.4,
  location: 0,
  distance: 10,
  maxPatternLength: 10,
  minMatchCharLength: 1,
  keys: [
    'label',
  ],
};

class AutoComplete extends React.Component<Props, State> { // eslint-disable-line react/prefer-stateless-function
  constructor(props: Props) {
    super(props);
    this.state = {
      value: '',
      prevValue: '',
      fuse: this.getFuse(),
      suggestions: [],
    };
  }

  getFuse = () => new Fuse<*>((this.props.data || []), (this.props.options || defaultOptions));

  getSuggestions = (value: string) => {
    const { data, limit } = this.props;
    const { fuse } = this.state;
    let suggestions;
    if (value) {
      suggestions = fuse.search(value);
    } else {
      suggestions = data || [];
    }
    // $FlowFixMe
    return limit ? suggestions.slice(0, limit) : suggestions;
  };

  handleSuggestionsFetchRequested = ({ value }: Object) => {
    if (!value && this.props.onDelete) {
      this.props.onDelete();
    }
    this.setState({
      suggestions: this.getSuggestions(value),
      value,
    });
  };

  handleSuggestionSelected = (event: Event, { suggestion }: Object) => {
    if (this.props.onSelect) {
      this.props.onSelect(suggestion.value);
    }
    if (!this.props.clearAfterSelect) {
      this.setState({ value: suggestion.label });
    }
  };

  renderSuggestion = (suggestion: Object, { isHighlighted }: Object) => (
    <MenuItem
      key={suggestion.label}
      selected={isHighlighted}
      onClick={() => {
        if (this.props.onClick) {
          this.props.onClick(suggestion);
        }
      }}
      component='div'
      style={{
        fontWeight: isHighlighted ? 500 : 400,
      }}
    >
      {suggestion.label}
    </MenuItem>
  );

  renderInput = (inputProps: Object) => {
    const { value, ...other } = inputProps;
    const { error, helperText, disabled, leftAdornment, inputClass, variant, className } = this.props;
    return (
      <TextField
        variant={variant}
        fullWidth
        InputProps={{
          startAdornment: leftAdornment,
          ...other,
          onBlur: () => {
            if (other.onBlur) {
              other.onBlur();
            }
            this.setState({ value: this.state.prevValue });
          },
          onFocus: () => {
            if (other.onFocus) {
              other.onFocus();
            }
            this.setState({ prevValue: this.state.value });
          },
          classes: {
            root: inputClass,
            input: inputClass,
            notchedOutline: inputClass,
          },
        }}
        value={this.state.value || this.props.defaultValue || ''}
        disabled={disabled}
        error={error}
        helperText={helperText}
        label={this.props.label || ''}
        placeholder={this.props.placeholder || ''}
        className={className}
      />
    );
  }

  render() {
    return (
      <AutoCompleteBase
        placeholder={this.props.placeholder || ''}
        suggestions={this.state.suggestions}
        handleSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
        handleSuggestionSelected={this.handleSuggestionSelected}
        renderSuggestion={this.props.renderSuggestion || this.renderSuggestion}
        renderInput={this.renderInput}
        handleChange={this.props.onChange}
      />
    );
  }
}

export default AutoComplete;

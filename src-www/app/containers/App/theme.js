// @flow

import { createMuiTheme } from '@material-ui/core/styles';
import { red, green, grey, cyan } from '@material-ui/core/colors';

const muiTheme = createMuiTheme({
  navigationWidth: 190,
  palette: {
    primary: {
      light: grey[500], // '#76d275',
      main: grey[700], // '#43a047',
      dark: grey[900], // '#00701a',
      contrastText: 'rgba(255, 255, 255, 1)',
    },
    secondary: {
      light: '#FF63FF',
      main: '#FF00FF',
      dark: '#c700cb',
      contrastText: 'rgba(0, 0, 0, 1)',
    },
    background: {
      default: '#f4f4f9',
    },
    error: red,
    success: green,
  },
  typography: {
    useNextVariants: true,
  },
});

export default muiTheme;

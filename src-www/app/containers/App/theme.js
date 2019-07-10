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
      light: cyan[300], // '#63a4f1',
      main: cyan[500], // '#1976d2',
      dark: cyan[700], // '#004ba0',
      contrastText: 'rgba(255, 255, 255, 1)',
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

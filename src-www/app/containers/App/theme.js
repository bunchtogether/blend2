// @flow

import { createMuiTheme } from '@material-ui/core/styles';
import { red, orange, pink } from '@material-ui/core/colors';

const muiTheme = createMuiTheme({
  navigationWidth: 190,
  palette: {
    primary: {
      light: orange[100], // '#76d275',
      main: orange[200], // '#43a047',
      dark: orange[500], // '#00701a',
      contrastText: 'rgba(255, 255, 255, 1)',
    },
    secondary: {
      light: pink[200], // '#63a4f1',
      main: pink[400], // '#1976d2',
      dark: pink[600], // '#004ba0',
      contrastText: 'rgba(255, 255, 255, 1)',
    },
    background: {
      default: '#f4f4f9',
    },
    error: red,
  },
  typography: {
    useNextVariants: true,
  },
});

export default muiTheme;

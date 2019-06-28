// @flow

import { createMuiTheme } from '@material-ui/core/styles';
import red from '@material-ui/core/colors/red';

const muiTheme = createMuiTheme({
  navigationWidth: 190,
  palette: {
    primary: {
      light: '#76d275',
      main: '#43a047',
      dark: '#00701a',
      contrastText: 'rgba(255, 255, 255, 1)',
    },
    secondary: {
      light: '#63a4f1',
      main: '#1976d2',
      dark: '#004ba0',
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

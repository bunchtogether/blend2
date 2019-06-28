/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 * NOTE: while this component should technically be a stateless functional
 * component (SFC), hot reloading does not currently support SFCs. If hot
 * reloading is not a necessity for you then you can refactor it and remove
 * the linting exception.
 */

import * as React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiThemeProvider } from '@material-ui/core/styles';
import Preview from 'containers/Preview';
import NotFoundPage from 'containers/NotFoundPage/Loadable';
import Notifications from 'components/Notifications';
import theme from './theme';

export default function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Notifications />
      <Switch>
        <Redirect exact push from='' to='/preview' />
        <Route exact path='/preview' component={Preview} />
        <Route component={NotFoundPage} />
      </Switch>
    </MuiThemeProvider>
  );
}


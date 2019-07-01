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
import Stream from 'containers/Stream';
import Remote from 'containers/Remote';
import Player from 'components/Player';
import NotFoundPage from 'containers/NotFoundPage/Loadable';
import Notifications from 'components/Notifications';
import theme from './theme';

export default function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Notifications />
      <Switch>

        <Route exact path='/' component={() => <Redirect exact push from='' to='/stream' />} />
        <Route exact path='/stream' component={Stream} />
        <Route exact path='/stream/:url' component={Stream} />
        <Route exact path='/remote' component={Remote} />
        <Route exact path='/api/1.0/stream/:url' component={Player} />
        <Route exact path='/api/1.0/ffmpeg/:args' component={Player} />
        <Route component={NotFoundPage} />
      </Switch>
    </MuiThemeProvider>
  );
}


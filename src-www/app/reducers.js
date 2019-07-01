/**
 * Combine all reducers in this file and export the combined reducers.
 */

import { combineReducers } from 'redux-immutable';
import appReducer from 'containers/App/reducer';
import languageProviderReducer from 'containers/LanguageProvider/reducer';
import { connectRouter } from 'connected-react-router/immutable';
import history from 'utils/history';

/**
 * Creates the main reducer with the dynamically injected ones
 */
export default function createReducer(injectedReducers) {
  return combineReducers({
    router: connectRouter(history),
    app: appReducer,
    language: languageProviderReducer,
    ...injectedReducers,
  });
}

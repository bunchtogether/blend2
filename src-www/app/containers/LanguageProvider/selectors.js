// @flow

import { createSelector } from 'reselect';

/**
 * Direct selector to the languageToggle state domain
 */
const selectLanguage = (state: StateType) => state.get('language');

/**
 * Select the language locale
 */

const makeSelectLocale = () => createSelector<StateType, *, *, *>(
  selectLanguage,
  (languageState) => languageState.get('locale'),
);

export {
  selectLanguage,
  makeSelectLocale,
};

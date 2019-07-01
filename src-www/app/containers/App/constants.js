/*
 * AppConstants
 * Each action has a corresponding type, which the reducer knows and picks up on.
 * To avoid weird typos between the reducer and the actions, we save them as
 * constants here. We prefix them with 'yourproject/YourComponent' so we avoid
 * reducers accidentally picking up actions they shouldn't.
 *
 * Follow this format:
 * export const YOUR_ACTION_CONSTANT = 'yourproject/YourContainer/YOUR_ACTION_CONSTANT';
 */

export const DEFAULT_LOCALE = 'en';

export const ADD_NOTIFICATION = 'web/App/ADD_NOTIFICATION';

export const LAYOUT_CHANGE = 'web/App/LAYOUT_CHANGE';
export const SHOW_NAVIGATION = 'web/App/SHOW_NAVIGATION';
export const HIDE_NAVIGATION = 'web/App/HIDE_NAVIGATION';
export const SEARCH = 'web/App/SEARCH';
export const CLEAR_SEARCH = 'web/App/CLEAR_SEARCH';

export const NAVIGATE_STREAM = 'web/App/NAVIGATE_STREAM';
export const NAVIGATE_REMOTE = 'web/App/NAVIGATE_REMOTE';

export const PAIR_DISPLAY = 'web/App/PAIR_DISPLAY';

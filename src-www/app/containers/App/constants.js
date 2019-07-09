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


export const SET_POWER = 'web/App/SET_POWER';
export const SET_POWER_SUCCESS = 'web/App/SET_POWER_SUCCESS';
export const SET_POWER_ERROR = 'web/App/SET_POWER_ERROR';
export const SET_VOLUME = 'web/App/SET_VOLUME';
export const SET_VOLUME_SUCCESS = 'web/App/SET_VOLUME_SUCCESS';
export const SET_VOLUME_ERROR = 'web/App/SET_VOLUME_ERROR';
export const SET_SOURCE = 'web/App/SET_SOURCE';
export const SET_SOURCE_SUCCESS = 'web/App/SET_SOURCE_SUCCESS';
export const SET_SOURCE_ERROR = 'web/App/SET_SOURCE_ERROR';
export const SET_MUTE = 'web/App/SET_MUTE';
export const SET_MUTE_SUCCESS = 'web/App/SET_MUTE_SUCCESS';
export const SET_MUTE_ERROR = 'web/App/SET_MUTE_ERROR';
export const TOGGLE_CC = 'web/App/TOGGLE_CC';
export const TOGGLE_CC_SUCCESS = 'web/App/TOGGLE_CC_SUCCESS';
export const TOGGLE_CC_ERROR = 'web/App/TOGGLE_CC_ERROR';

export const GET_PAIRED_DEVICE = 'web/App/GET_PAIRED_DEVICE';
export const GET_PAIRED_DEVICE_SUCCESS = 'web/App/GET_PAIRED_DEVICE_SUCCESS';
export const GET_PAIRED_DEVICE_ERROR = 'web/App/GET_PAIRED_DEVICE_ERROR';
export const UNPAIR_DEVICE = 'web/App/UNPAIR_DEVICE';
export const UNPAIR_DEVICE_SUCCESS = 'web/App/UNPAIR_DEVICE_SUCCESS';
export const UNPAIR_DEVICE_ERROR = 'web/App/UNPAIR_DEVICE_ERROR';

export const RESET_PAIRING = 'web/App/RESET_PAIRING';
export const DISCOVER_DEVICES = 'web/App/DISCOVER_DEVICES';
export const DISCOVER_DEVICES_ERROR = 'web/App/DISCOVER_DEVICES_ERROR';
export const SET_DISCOVERED_DEVICES = 'web/App/SET_DISCOVERED_DEVICES';
export const START_PAIRING = 'web/App/START_PAIRING';
export const START_PAIRING_ERROR = 'web/App/START_PAIRING_ERROR';
export const START_PAIRING_SUCCESS = 'web/App/START_PAIRING_SUCCESS';
export const PAIR_DEVICE = 'web/App/PAIR_DEVICE';
export const PAIR_DEVICE_ERROR = 'web/App/PAIR_DEVICE_ERROR';
export const PAIR_DEVICE_SUCCESS = 'web/App/PAIR_DEVICE_SUCCESS';

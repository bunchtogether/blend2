// @flow

import { List, OrderedSet, fromJS } from 'immutable';
import * as constants from './constants';


const initialState = fromJS({
  navigationVisible: false,
  searchQuery: '',
  notifications: OrderedSet(),
  deviceLoaded: false,
  pairedDevice: null,
  discoveryDeviceType: '',
  discoveredDevices: null,
  startPairingSuccess: null,
  pairDeviceSuccess: null,
  pairDiscover: null,
  remoteError: '',
  availableLogs: List(),
  deviceIp: fromJS({ ip: null }),
});

export default (state: AppStateType = initialState, action: ActionType) => {
  switch (action.type) {
    case constants.ADD_NOTIFICATION:
      const notifications = state.get('notifications').takeLast(10).add(fromJS(action.value)); // eslint-disable-line no-case-declarations
      return state.set('notifications', notifications);
    case constants.SHOW_NAVIGATION:
      return state.set('navigationVisible', true);
    case constants.HIDE_NAVIGATION:
      return state.set('navigationVisible', false);
    case constants.SEARCH:
      return state.set('searchQuery', action.value);
    case constants.CLEAR_SEARCH:
      return state.set('searchQuery', '');
    case constants.PAIR_DISCOVER:
      return state.set('pairDiscover', null);
    case constants.PAIR_DISCOVER_SUCCESS:
      return state.set('pairDiscover', true);
    case constants.PAIR_DISCOVER_ERROR:
      return state.set('pairDiscover', false);
    case constants.GET_PAIRED_DEVICE_SUCCESS:
      return state.set('pairedDevice', action.value).set('deviceLoaded', true);
    case constants.GET_PAIRED_DEVICE_ERROR:
      return state.set('deviceLoaded', true);
    case constants.DISCOVER_DEVICES:
      return state.set('discoveryDeviceType', action.value).set('discoveredDevices', null);
    case constants.SET_DISCOVERED_DEVICES:
      return state.set('discoveredDevices', Array.isArray(action.value) ? List(action.value) : null);
    case constants.START_PAIRING:
      return state.set('startPairingSuccess', null);
    case constants.START_PAIRING_SUCCESS:
      return state.set('startPairingSuccess', true);
    case constants.START_PAIRING_ERROR:
      return state.set('startPairingSuccess', false);
    case constants.PAIR_DEVICE:
      return state.set('pairDeviceSuccess', null);
    case constants.PAIR_DEVICE_SUCCESS:
      return state.set('pairDeviceSuccess', true);
    case constants.PAIR_DEVICE_ERROR:
      return state.set('pairDeviceSuccess', false);
    case constants.RESET_PAIRING:
      return state.merge({
        discoveredDevices: null,
        startPairingSuccess: null,
        pairDeviceSuccess: null,
      });
    case constants.SET_POWER:
      return state.set('remoteError', '');
    case constants.SET_VOLUME:
      return state.set('remoteError', '');
    case constants.TOGGLE_MUTE:
      return state.set('remoteError', '');
    case constants.SET_SOURCE:
      return state.set('remoteError', '');
    case constants.SET_POWER_ERROR:
      return state.set('remoteError', action.value);
    case constants.SET_VOLUME_ERROR:
      return state.set('remoteError', action.value);
    case constants.TOGGLE_MUTE_ERROR:
      return state.set('remoteError', action.value);
    case constants.SET_SOURCE_ERROR:
      return state.set('remoteError', action.value);
    case constants.GET_DEVICE_IP_RESULT:
      return state.set('deviceIp', fromJS(action.value));
    case constants.SET_DEVICE_IP_RESULT:
      return state.set('deviceIp', fromJS(action.value));
    case constants.GET_DEVICE_IP_ERROR:
      return state.set('deviceIp', fromJS({ ip: '' }));
    case constants.SET_DEVICE_IP_ERROR:
      return state.set('deviceIp', fromJS({ ip: '' }));

    // LOG FILES
    case constants.GET_LOGS_SUCCESS:
      return state.set('availableLogs', List(action.value));
    default:
      return state;
  }
};

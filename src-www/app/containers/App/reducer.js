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
  previousVolue: 0,
  previousPower: false,
  previousSource: 'HDMI-1',
  previousMute: false,
});

export default (state: AppStateType = initialState, action: ActionType) => {
  const pairedDevice = state.get('pairedDevice');
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
    case constants.SET_POWER:
      return state.set('previousPower', action.value);
    case constants.SET_POWER_SUCCESS:
      pairedDevice.power = action.value;
      return state.set('pairedDevice', pairedDevice);
    case constants.SET_POWER_ERROR:
      pairedDevice.power = state.get('previousPower');
      return state.set('pairedDevice', pairedDevice);
    case constants.SET_VOLUME:
      return state.set('previousVolume', action.value);
    case constants.SET_VOLUME_SUCCESS:
      pairedDevice.volume = action.value;
      return state.set('pairedDevice', pairedDevice);
    case constants.SET_VOLUME_ERROR:
      pairedDevice.volume = state.get('previousVolume');
      return state.set('pairedDevice', pairedDevice);
    case constants.SET_SOURCE:
      return state.set('previousSource', action.value);
    case constants.SET_SOURCE_SUCCESS:
      pairedDevice.source = action.value;
      return state.set('pairedDevice', pairedDevice);
    case constants.SET_SOURCE_ERROR:
      pairedDevice.source = state.get('previousSource');
      return state.set('pairedDevice', pairedDevice);
    case constants.SET_MUTE:
      return state.set('previousMute', action.value);
    case constants.SET_MUTE_SUCCESS:
      pairedDevice.mute = action.value;
      return state.set('pairedDevice', pairedDevice);
    case constants.SET_MUTE_ERROR:
      pairedDevice.mute = state.get('previousMute');
      return state.set('pairedDevice', pairedDevice);
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
    default:
      return state;
  }
};

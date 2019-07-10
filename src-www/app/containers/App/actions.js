// @flow

import uuid from 'uuid';
import * as constants from './constants';

export function addNotification(message: string | React.node, onClose?: Function): ActionType {
  return {
    type: constants.ADD_NOTIFICATION,
    value: {
      id: uuid.v4(),
      created: Date.now(),
      message,
      onClose,
    },
  };
}

export function handleLayoutChange(width: number, height: number): ActionType {
  return {
    type: constants.LAYOUT_CHANGE,
    value: {
      width,
      height,
    },
  };
}

export function hideNavigation(): ActionType {
  return {
    type: constants.HIDE_NAVIGATION,
    value: null,
  };
}

export function showNavigation(): ActionType {
  return {
    type: constants.SHOW_NAVIGATION,
    value: null,
  };
}

export function search(value: string): ActionType {
  return {
    type: constants.SEARCH,
    value,
  };
}

export function navigateStream(url?: string): ActionType {
  return {
    type: constants.NAVIGATE_STREAM,
    value: url,
  };
}

export function navigateRemote(): ActionType {
  return {
    type: constants.NAVIGATE_REMOTE,
    value: null,
  };
}

export function setPower(power: boolean): ActionType {
  return {
    type: constants.SET_POWER,
    value: power,
  };
}

export function setVolume(volume: boolean): ActionType {
  return {
    type: constants.SET_VOLUME,
    value: volume,
  };
}

export function setSource(source: string): ActionType {
  return {
    type: constants.SET_SOURCE,
    value: source,
  };
}

export function setMute(mute: boolean): ActionType {
  return {
    type: constants.SET_MUTE,
    value: mute,
  };
}

export function getPairedDevice(): ActionType {
  return {
    type: constants.GET_PAIRED_DEVICE,
    value: null,
  };
}

export function unpairDevice(): ActionType {
  return {
    type: constants.UNPAIR_DEVICE,
    value: null,
  };
}

export function resetPairing(): ActionType {
  return {
    type: constants.RESET_PAIRING,
    value: null,
  };
}

export function discoverDevices(type: string): ActionType {
  return {
    type: constants.DISCOVER_DEVICES,
    value: type,
  };
}

export function setDiscoveredDevices(device: Object): ActionType {
  return {
    type: constants.SET_DISCOVERED_DEVICES,
    value: device,
  };
}

export function startPairing(type: string, data: Object): ActionType {
  return {
    type: constants.START_PAIRING,
    value: {
      type,
      data,
    },
  };
}

export function pairDevice(data: Object): ActionType {
  return {
    type: constants.PAIR_DEVICE,
    value: data,
  };
}

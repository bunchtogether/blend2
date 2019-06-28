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

export function navigatePreview(): ActionType {
  return {
    type: constants.NAVIGATE_PREVIEW,
    value: null,
  };
}

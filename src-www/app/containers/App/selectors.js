// @flow

import { createSelector } from 'reselect';

const selectRoute = (state) => state.get('route');

export const makeSelectLocation = () => createSelector<StateType, *, *, *>(
  selectRoute,
  (routeState) => routeState.get('location').toJS(),
);

const appState = (state: StateType) => state.get('app');


export const navigationVisibleSelector = createSelector<StateType, *, *, *>(
  appState,
  (state: StateType): bool => state.get('navigationVisible'),
);

export const searchQuerySelector = createSelector<StateType, *, *, *>(
  appState,
  (state: Object): string => state.get('searchQuery'),
);

export const draggingSelector = createSelector<StateType, *, *, *>(
  appState,
  (state: Object): string => state.get('dragging'),
);

export const fileForUploadSelector = createSelector<StateType, *, *, *>(
  appState,
  (state: Object): string => state.get('fileForUpload'),
);

export const canAutoplayUnmutedSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('canAutoplayUnmuted'),
);

export const uploadStatusSelector = (state: StateType, filePath: string) => state.getIn(['app', 'uploadStatus', filePath]);

export const deviceLoadedSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('deviceLoaded'),
);

export const pairedDeviceSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('pairedDevice'),
);

export const sourcesSelector = createSelector<StateType, *, *, *>(
  pairedDeviceSelector,
  (device) => (device ? device.sources : null),
);

export const discoveryDeviceTypeSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('discoveryDeviceType'),
);

export const discoveredDevicesSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('discoveredDevices'),
);

export const startPairingSuccessSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('startPairingSuccess'),
);

export const pairDeviceSuccessSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('pairDeviceSuccess'),
);

export const remoteErrorSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('remoteError'),
);

export const availableLogsSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.get('availableLogs'),
);

export const deviceIpSelector = createSelector<StateType, *, *, *>(
  appState,
  (state) => state.getIn(['deviceIp', 'ip']),
);

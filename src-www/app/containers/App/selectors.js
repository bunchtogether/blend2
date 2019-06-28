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

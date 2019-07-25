// @flow

import * as React from 'react';
import type { List, RecordInstance, Map } from 'immutable';

type NotificationType = RecordInstance<{
  id: string,
  created: number,
  clickAction?: ActionType,
  message: string | React.node
}>;

type AppStateType = RecordInstance<{
  navigationVisible: boolean,
  searchQuery: '',
  dragging: boolean,
  privateKey?: Object,
  id?: string,
  addresses?: Array<string>,
  notifications: List<NotificationType>
}>;

type StateType = RecordInstance<{
  route: Object,
  language: Object,
  app: AppStateType,
  loadingReport: boolean
}>;

type ActionType = {
  type: string,
  value: any
};

type ClassesType = {
  [string]: string
};

type ThemeType = {
  [string]: Object
};

// $FlowFixMe
type MapType<K,V> = Map<K,V>;
// $FlowFixMe
type ListType<T> = List<T>;
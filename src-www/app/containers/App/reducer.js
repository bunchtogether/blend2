// @flow

import { OrderedSet, fromJS } from 'immutable';
import {
  SHOW_NAVIGATION,
  HIDE_NAVIGATION,
  SEARCH,
  CLEAR_SEARCH,
  ADD_NOTIFICATION,
} from './constants';


const initialState = fromJS({
  navigationVisible: false,
  searchQuery: '',
  notifications: OrderedSet(),
});

export default (state: AppStateType = initialState, action: ActionType) => {
  switch (action.type) {
    case ADD_NOTIFICATION:
      const notifications = state.get('notifications').takeLast(10).add(fromJS(action.value)); // eslint-disable-line no-case-declarations
      return state.set('notifications', notifications);
    case SHOW_NAVIGATION:
      return state.set('navigationVisible', true);
    case HIDE_NAVIGATION:
      return state.set('navigationVisible', false);
    case SEARCH:
      return state.set('searchQuery', action.value);
    case CLEAR_SEARCH:
      return state.set('searchQuery', '');
    default:
      return state;
  }
};

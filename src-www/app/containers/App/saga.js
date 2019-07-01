// @flow

import type { Saga } from 'redux-saga';
import { push } from 'connected-react-router';
import { select, put, takeLatest, call } from 'redux-saga/effects';
import superagent from 'superagent';
// import { braidClient } from '@bunchtogether/boost-client';
import * as constants from './constants';

const PROJECT_PROTOCOL = process.env.BLEND_PROTOCOL || window.location.protocol; // eslint-disable-line no-nested-ternary
const PROJECT_HOST = process.env.BLEND_HOST || window.location.hostname;
const PROJECT_PORT = process.env.BLEND_PORT || window.location.port;
const BASE_API_URL = `${PROJECT_PROTOCOL}://${PROJECT_HOST}:${PROJECT_PORT}/api/1.0`;

// const BRAID_PROTOCOL = PROJECT_PROTOCOL === 'https' ? 'wss' : 'ws';

// function* braidConnectionSaga(): Saga<*> {
//   const braidUrl = `${BRAID_PROTOCOL}://${PROJECT_HOST}:${PROJECT_PORT}/braid`;
//   if (braidClient.ws) {
//     yield call(braidClient.sendCredentials.bind(braidClient), {});
//   } else {
//     yield call(braidClient.open.bind(braidClient), braidUrl, {});
//   }
// }

// function* setupSaga(): Saga<*> {
//   yield fork(braidConnectionSaga);
// }

function* searchSaga(action: ActionType): Saga<*> {
  const pathname = yield select((state) => state.getIn(['route', 'location', 'pathname']));
  if (action.value) {
    yield put(push(`${pathname}?query=${action.value}`));
  } else {
    yield put(push(pathname));
  }
}

function* pairDisplaySaga(action: ActionType): Saga<*> {
  const result = yield call(() => superagent.post(`${BASE_API_URL}/pair`).send({ type: action.value }));
  console.log(result);
}

function* navigate(pathname: string, action: ActionType): Saga<*> {
  yield put({ type: constants.HIDE_NAVIGATION, value: null });
  yield put({ type: constants.CLEAR_SEARCH, value: '' });
  if (action.value) {
    yield put(push(`${pathname}/${encodeURIComponent(action.value)}`));
  } else {
    yield put(push(pathname));
  }
}

export default function* defaultSaga(): Saga<*> {
  yield takeLatest(constants.SEARCH, searchSaga);
  yield takeLatest(constants.PAIR_DISPLAY, pairDisplaySaga);
  yield takeLatest(constants.NAVIGATE_STREAM, navigate, '/stream');
  yield takeLatest(constants.NAVIGATE_REMOTE, navigate, '/remote');
  // yield call(setupSaga);
}


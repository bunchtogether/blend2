// @flow

import type { Saga } from 'redux-saga';
import { push } from 'connected-react-router';
import { select, put, takeLatest, call } from 'redux-saga/effects';
import superagent from 'superagent';
import { setDiscoveredDevices } from 'containers/App/actions';
import * as constants from './constants';

const PROJECT_PROTOCOL = process.env.BLEND_PROTOCOL || window.location.protocol;
const PROJECT_HOST = process.env.BLEND_HOST || window.location.hostname;
const PROJECT_PORT = process.env.BLEND_PORT || window.location.port;
const BASE_API_URL = `${PROJECT_PROTOCOL}://${PROJECT_HOST}:${PROJECT_PORT}/api/1.0`;

function* searchSaga(action: ActionType): Saga<*> {
  const pathname = yield select((state) => state.getIn(['route', 'location', 'pathname']));
  if (action.value) {
    yield put(push(`${pathname}?query=${action.value}`));
  } else {
    yield put(push(pathname));
  }
}

function* discoverDevicesSaga(action: ActionType): Saga<*> {
  try {
    const { body: { devices } } = yield call(() => superagent.post(`${BASE_API_URL}/pair/discover`).send({ type: action.value }));
    yield put(setDiscoveredDevices(devices));
  } catch (error) {
    yield put({ type: constants.DISCOVER_DEVICES_ERROR, value: error });
  }
}

function* startPairingSaga(action: ActionType): Saga<*> {
  try {
    yield call(
      () => superagent
        .post(`${BASE_API_URL}/pair/start`)
        .send({
          type: action.value.type,
          data: action.value.data,
        }),
    );
    yield put({ type: constants.START_PAIRING_SUCCESS, value: null });
  } catch (error) {
    yield put({ type: constants.START_PAIRING_ERROR, value: error });
  }
}

function* pairDeviceSaga(action: ActionType): Saga<*> {
  try {
    yield call(
      () => superagent
        .post(`${BASE_API_URL}/pair`)
        .send({
          data: action.value,
        }),
    );
    yield put({ type: constants.PAIR_DEVICE_SUCCESS, value: null });
  } catch (error) {
    yield put({ type: constants.PAIR_DEVICE_ERROR, value: error });
  }
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
  yield takeLatest(constants.DISCOVER_DEVICES, discoverDevicesSaga);
  yield takeLatest(constants.START_PAIRING, startPairingSaga);
  yield takeLatest(constants.PAIR_DEVICE, pairDeviceSaga);
  yield takeLatest(constants.NAVIGATE_STREAM, navigate, '/stream');
  yield takeLatest(constants.NAVIGATE_REMOTE, navigate, '/remote');
}


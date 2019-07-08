// @flow

import type { Saga } from 'redux-saga';
import { push } from 'connected-react-router';
import { select, put, takeLatest, call, throttle } from 'redux-saga/effects';
import superagent from 'superagent';
import { setDiscoveredDevices, getPairedDevice, resetPairing } from 'containers/App/actions';
import * as constants from './constants';

const PROJECT_PROTOCOL = process.env.BLEND_PROTOCOL || window.location.protocol.replace(':', '');
const PROJECT_HOST = process.env.BLEND_HOST || window.location.hostname;
const PROJECT_PORT = process.env.BLEND_PORT || window.location.port;
const BASE_API_URL = `${PROJECT_PROTOCOL}://${PROJECT_HOST}:${PROJECT_PORT}/api/1.0`;

function* setupSaga(): Saga<*> {
  yield put(getPairedDevice());
}

function* searchSaga(action: ActionType): Saga<*> {
  const pathname = yield select((state) => state.getIn(['route', 'location', 'pathname']));
  if (action.value) {
    yield put(push(`${pathname}?query=${action.value}`));
  } else {
    yield put(push(pathname));
  }
}

function* setPowerSaga(action: ActionType): Saga<*> {
  try {
    const { body: { power } } = yield call(() => superagent.post(`${BASE_API_URL}/device/power`).send({ power: action.value }));
    yield put({ type: constants.SET_POWER_SUCCESS, value: power });
  } catch (error) {
    yield put({ type: constants.SET_POWER_ERROR, value: error });
  }
}

function* setVolumeSaga(action: ActionType): Saga<*> {
  try {
    const { body: { volume } } = yield call(() => superagent.post(`${BASE_API_URL}/device/volume`).send({ volume: action.value }));
    yield put({ type: constants.SET_VOLUME_SUCCESS, value: volume });
  } catch (error) {
    yield put({ type: constants.SET_VOLUME_ERROR, value: error });
  }
}

function* setSourceSaga(action: ActionType): Saga<*> {
  try {
    const { body: { source } } = yield call(() => superagent.post(`${BASE_API_URL}/device/source`).send({ source: action.value }));
    yield put({ type: constants.SET_SOURCE_SUCCESS, value: source });
  } catch (error) {
    yield put({ type: constants.SET_SOURCE_ERROR, value: error });
  }
}

function* getPairedDeviceSaga(): Saga<*> {
  try {
    const { body: { device } } = yield call(() => superagent.get(`${BASE_API_URL}/pair`));
    yield put({ type: constants.GET_PAIRED_DEVICE_SUCCESS, value: device });
  } catch (error) {
    yield put({ type: constants.GET_PAIRED_DEVICE_ERROR, value: error });
  }
}

function* unpairDeviceSaga(): Saga<*> {
  try {
    yield call(() => superagent.post(`${BASE_API_URL}/pair/remove`));
    yield put(resetPairing());
    yield put(getPairedDevice());
    yield put({ type: constants.UNPAIR_DEVICE_SUCCESS, value: null });
  } catch (error) {
    yield put({ type: constants.UNPAIR_DEVICE_ERROR, value: error });
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
    yield put(getPairedDevice());
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
  yield takeLatest(constants.SET_POWER, setPowerSaga);
  yield throttle(1000, constants.SET_VOLUME, setVolumeSaga);
  yield takeLatest(constants.SET_SOURCE, setSourceSaga);
  yield takeLatest(constants.GET_PAIRED_DEVICE, getPairedDeviceSaga);
  yield takeLatest(constants.UNPAIR_DEVICE, unpairDeviceSaga);
  yield takeLatest(constants.DISCOVER_DEVICES, discoverDevicesSaga);
  yield takeLatest(constants.START_PAIRING, startPairingSaga);
  yield takeLatest(constants.PAIR_DEVICE, pairDeviceSaga);
  yield takeLatest(constants.NAVIGATE_STREAM, navigate, '/stream');
  yield takeLatest(constants.NAVIGATE_REMOTE, navigate, '/remote');
  yield call(setupSaga);
}


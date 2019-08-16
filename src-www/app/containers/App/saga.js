// @flow

import type { Saga } from 'redux-saga';
import { push } from 'connected-react-router';
import { select, put, takeLatest, call, throttle } from 'redux-saga/effects';
import superagent from 'superagent';
import { setDiscoveredDevices, getPairedDevice, resetPairing, navigateSetup } from 'containers/App/actions';
import * as constants from './constants';

const PROJECT_PROTOCOL = process.env.BLEND_PROTOCOL || window.location.protocol.replace(':', '');
const PROJECT_HOST = process.env.BLEND_HOST || window.location.hostname;
const PROJECT_PORT = process.env.BLEND_PORT || window.location.port;
const BASE_API_URL = `${PROJECT_PROTOCOL}://${PROJECT_HOST}:${PROJECT_PORT}/api/1.0`;

function* setupSaga(): Saga<*> {
  yield* getDeviceIpSaga();
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

// DEVICE SAGAS
function* setPowerSaga(action: ActionType): Saga<*> {
  try {
    const { body: { power } } = yield call(() => superagent.post(`${BASE_API_URL}/device/power`).send({ power: action.value }));
    yield put({ type: constants.SET_POWER_SUCCESS, value: power });
  } catch (error) {
    const { response: { text } } = error;
    yield put({ type: constants.SET_POWER_ERROR, value: text || 'Unknown Error' });
  }
}

function* setVolumeSaga(action: ActionType): Saga<*> {
  try {
    const { body: { volume } } = yield call(() => superagent.post(`${BASE_API_URL}/device/volume`).send({ volume: action.value }));
    yield put({ type: constants.SET_VOLUME_SUCCESS, value: volume });
  } catch (error) {
    const { response: { text } } = error;
    yield put({ type: constants.SET_VOLUME_ERROR, value: text || 'Unknown Error' });
  }
}

function* toggleMuteSaga(): Saga<*> {
  try {
    yield call(() => superagent.post(`${BASE_API_URL}/device/mute`));
    yield put({ type: constants.TOGGLE_MUTE_SUCCESS, value: null });
  } catch (error) {
    const { response: { text } } = error;
    yield put({ type: constants.TOGGLE_MUTE_ERROR, value: text || 'Unknown Error' });
  }
}

function* setSourceSaga(action: ActionType): Saga<*> {
  try {
    const { body: { source } } = yield call(() => superagent.post(`${BASE_API_URL}/device/source`).send({ source: action.value }));
    yield put({ type: constants.SET_SOURCE_SUCCESS, value: source });
  } catch (error) {
    const { response: { text } } = error;
    yield put({ type: constants.SET_SOURCE_ERROR, value: text || 'Unknown Error' });
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

// LOGS SAGAS
export function* getLogsSaga(): Saga<*> {
  try {
    const response = yield call(() => superagent.get(`${BASE_API_URL}/logs`));
    yield put({ type: constants.GET_LOGS_SUCCESS, value: response.body });
  } catch (e) {
    yield put({ type: constants.GET_LOGS_ERROR, value: e });
  }
}

export function* generateLogsSaga(): Saga<*> {
  try {
    const response = yield call(() => superagent.post(`${BASE_API_URL}/logs/generate`));
    yield put({ type: constants.GENERATE_LOGS_SUCCESS, value: response.body });
  } catch (e) {
    yield put({ type: constants.GENERATE_LOGS_ERROR, value: e });
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

function* getDeviceIpSaga(): Saga<*> {
  try {
    const result = yield call(() => superagent.get(`${BASE_API_URL}/setup/ip`));
    if (result && result.body) {
      if (result.body.ip === '') {
        yield put(navigateSetup());
      }
      yield put({ type: constants.GET_DEVICE_IP_RESULT, value: result.body });
    }
  } catch (error) {
    yield put({ type: constants.GET_DEVICE_IP_ERROR, value: error });
  }
}

function* setDeviceIpSaga(action: ActionType): Saga<*> {
  try {
    const result = yield call(() => superagent.put(`${BASE_API_URL}/setup/ip`).send({ ip: action.value }));
    if (result && result.status === 200) {
      yield put({ type: constants.SET_DEVICE_IP_RESULT, value: { ip: action.value } });
    }
  } catch (error) {
    yield put({ type: constants.SET_DEVICE_IP_ERROR, value: error });
  }
}

function* deviceUpdateSaga(): Saga<*> {
  try {
    const result = yield call(() => superagent.post(`${BASE_API_URL}/setup/update-device`));
    if (result && result.status === 200) {
      yield put({ type: constants.TRIGGER_DEVICE_UPDATE_RESULT, value: 'success' });
    }
  } catch (error) {
    yield put({ type: constants.TRIGGER_DEVICE_UPDATE_ERROR, value: error });
  }
}


export default function* defaultSaga(): Saga<*> {
  yield takeLatest(constants.SEARCH, searchSaga);
  // DEVICE
  yield takeLatest(constants.SET_POWER, setPowerSaga);
  yield throttle(1000, constants.SET_VOLUME, setVolumeSaga);
  yield takeLatest(constants.TOGGLE_MUTE, toggleMuteSaga);
  yield takeLatest(constants.SET_SOURCE, setSourceSaga);
  yield takeLatest(constants.GET_PAIRED_DEVICE, getPairedDeviceSaga);
  yield takeLatest(constants.UNPAIR_DEVICE, unpairDeviceSaga);
  yield takeLatest(constants.DISCOVER_DEVICES, discoverDevicesSaga);
  yield takeLatest(constants.START_PAIRING, startPairingSaga);
  yield takeLatest(constants.PAIR_DEVICE, pairDeviceSaga);
  // LOGS
  yield takeLatest(constants.GET_LOGS, getLogsSaga);
  yield takeLatest(constants.GENERATE_LOGS, generateLogsSaga);
  // NAVIGATION
  yield takeLatest(constants.NAVIGATE_STREAM, navigate, '/stream');
  yield takeLatest(constants.NAVIGATE_REMOTE, navigate, '/remote');
  yield takeLatest(constants.NAVIGATE_SETUP, navigate, '/setup');
  // SETUP
  yield takeLatest(constants.GET_DEVICE_IP, getDeviceIpSaga);
  yield takeLatest(constants.SET_DEVICE_IP, setDeviceIpSaga);
  yield takeLatest(constants.TRIGGER_DEVICE_UPDATE, deviceUpdateSaga);
  yield call(setupSaga);
}


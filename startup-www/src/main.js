
import 'core-js/stable';
import 'regenerator-runtime/runtime';

const parsedSearch = new URLSearchParams(window.location.search);
const redirectUrl = parsedSearch.get('redirect');
const blendEndpoint = 'http://127.0.0.1:61340/api/1.0/capabilities';
const boostImageEndpoint = '/api/v1.0/health-check/image';

const successSvg = 'images/success.svg';
const errorSvg = 'images/error.svg';
const loadingSvg = 'images/loading.svg';

const INTERVAL_DURATION = 5000; // 5 secs

// Core
const updateServices = function (capabilities) {
  console.log('Update Services');
  if (capabilities.isServerAvailable) {
    document.querySelector('#band-services-warning').innerText = '';
    document.querySelector('#band-services-status').setAttribute('src', successSvg);
    return true;
  }
  document.querySelector('#band-services-status').setAttribute('src', loadingSvg);
  document.querySelector('#band-services-warning').innerText = 'Device is not ready';
  return false;
};

const updateNetwork = function (capabilities) {
  console.log('Update Network');
  if (capabilities.macAddress && capabilities.ipAddress) {
    document.querySelector('#band-network-warning').innerText = '';
    document.querySelector('#band-network-status').setAttribute('src', successSvg);
    return true;
  }
  if (capabilities.macAddress && !capabilities.ipAddress) {
    document.querySelector('#band-network-warning').innerText = 'IP address is not available';
  } else if (!capabilities.macAddress && capabilities.ipAddress) {
    document.querySelector('#band-network-warning').innerText = 'MAC address is not available';
  } else {
    document.querySelector('#band-network-warning').innerText = 'Network is not available';
  }
  document.querySelector('#band-network-status').setAttribute('src', loadingSvg);
  return false;
};

const updateBandServer = async function (capabilities) {
  if (!redirectUrl) {
    document.querySelector('#band-server-status').setAttribute('src', loadingSvg);
    document.querySelector('#band-server-warning').innerText = 'Band URL is not configured';
    return false;
  }
  return new Promise((resolve) => {
    const imageNode = document.createElement('img');
    imageNode.onload = function (event) {
      document.querySelector('#band-server-warning').innerText = '';
      document.querySelector('#band-server-status').setAttribute('src', successSvg);
      resolve(true);
    };
    imageNode.onerror = function (event) {
      document.querySelector('#band-server-status').setAttribute('src', loadingSvg);
      document.querySelector('#band-server-warning').innerText = 'Can not reach application';
      document.querySelector('#band-server-warning2').innerText = `${redirectUrl}`;
      resolve(false);
    };

    const imageUrl = redirectUrl + boostImageEndpoint;
    imageNode.setAttribute('style', 'display:none;');
    imageNode.setAttribute('src', imageUrl);
    document.querySelector('#hiddenimage').appendChild(imageNode);
  });
};


const delay = async (time = 1000) => new Promise((resolve) => setTimeout(resolve, time));

const checkCapabilities = async function () {
  let capabilities = {};
  try {
    const response = await fetch(blendEndpoint);
    capabilities = await response.json();
    console.log(capabilities);
  } catch (error) {
    document.querySelector('#band-services-status').setAttribute('src', loadingSvg);
    document.querySelector('#band-services-warning').innerText = 'Device is not ready';
  }

  await delay(500);
  const serviceStatus = updateServices(capabilities);
  await delay(1000);
  const networkStatus = updateNetwork(capabilities);
  await delay(1000);
  const serverStatus = await updateBandServer(capabilities);
  console.log(serviceStatus, networkStatus, serverStatus);

  if (serviceStatus && networkStatus && serverStatus) {
    await delay(800);
    window.location.href = redirectUrl;
  }
};


let checkInterval;
let timeInterval;
const initCheck = async function () {
  try {
    checkInterval = setInterval(async () => {
      // Check
      await checkCapabilities();
    }, INTERVAL_DURATION); // Every 5 secs

    // Clock
    document.querySelector('#localtime').innerText = new Date().toLocaleString();
    timeInterval = setInterval(() => {
      document.querySelector('#localtime').innerText = new Date().toLocaleString();
    }, 500);


    await checkCapabilities();
  } catch (error) {
    console.error('Failed to initiate check', error);
  }
};


// Init
window.addEventListener('load', () => initCheck(), false);
window.addEventListener('unload', (event) => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});

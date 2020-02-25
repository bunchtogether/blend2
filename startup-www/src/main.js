
import 'core-js/stable';
import 'regenerator-runtime/runtime';

const parsedSearch = new URLSearchParams(window.location.search);
const redirectUrl = parsedSearch.get('redirect');
const blendEndpoint = 'http://127.0.0.1:61340/api/1.0/capabilities';

const successSvg = 'images/success.svg';
const errorSvg = 'images/error.svg';
const loadingSvg = 'images/loading.svg';

const INTERVAL_DURATION = 5000; // 5 secs

// Core
const updateServices = function (capabilities) {
  console.log('Update Services');
  if (capabilities.isServerAvailable) {
    document.querySelector('#band-services-status').setAttribute('src', successSvg);
    return true;
  }
  document.querySelector('#band-services-warning').innerText = 'Device is not ready';
  document.querySelector('#band-services-status').setAttribute('src', errorSvg);
  return false;
};

const updateNetwork = function (capabilities) {
  console.log('Update Network');
  if (capabilities.macAddress && capabilities.ipAddress) {
    document.querySelector('#band-network-status').setAttribute('src', successSvg);
    return true;
  }
  if (capabilities.macAddress && !capabilities.ipAddress) {
    document.querySelector('#band-network-warning').innerText = 'IP Address is not available';
  } else if (!capabilities.macAddress && capabilities.ipAddress) {
    document.querySelector('#band-network-warning').innerText = 'MAC Address is not available';
  } else {
    document.querySelector('#band-network-warning').innerText = 'Network not configured';
  }
  document.querySelector('#band-network-status').setAttribute('src', errorSvg);
  return false;
};

const updateBandServer = async function (capabilities) {
  if (!redirectUrl) {
    document.querySelector('#band-server-status').setAttribute('src', errorSvg);
    document.querySelector('#band-server-warning').innerText = 'Band Server is not configured';
    return false;
  }
  return new Promise((resolve) => {
    const imageNode = document.createElement('img');
    imageNode.onload = function (event) {
      document.querySelector('#band-server-status').setAttribute('src', successSvg);
      resolve(true);
    };
    imageNode.onerror = function (event) {
      document.querySelector('#band-server-status').setAttribute('src', errorSvg);
      document.querySelector('#band-server-warning').innerText = `${redirectUrl} is not reachable`;
      resolve(false);
    };
    imageNode.setAttribute('style', 'display:none;');
    imageNode.setAttribute('src', `${redirectUrl}/images/favicon-96x96.png`);
    document.querySelector('#hiddenimage').appendChild(imageNode);
  });
};


const checkCapabilities = async function () {
  let capabilities = {};
  try {
    const response = await fetch(blendEndpoint);
    capabilities = await response.json();
    console.log(capabilities);
  } catch (error) {
    document.querySelector('#band-services-status').setAttribute('src', errorSvg);
    document.querySelector('#band-services-warning').innerText = 'Device is not ready';
  }

  const serviceStatus = updateServices(capabilities);
  const networkStatus = updateNetwork(capabilities);
  const serverStatus = await updateBandServer(capabilities);

  if (serviceStatus && networkStatus && serverStatus) {
    window.location.href = redirectUrl;
  }
};


let checkInterval;
let timeInterval;
const initCheck = async function () {
  try {
    checkInterval = setInterval(async () => {
      document.querySelector('#localtime').innerText = new Date().toLocaleString();

      // Reset Status
      document.querySelector('#band-services-status').setAttribute('src', loadingSvg);
      document.querySelector('#band-network-status').setAttribute('src', loadingSvg);
      document.querySelector('#band-server-status').setAttribute('src', loadingSvg);
      document.querySelector('#band-services-warning').innerText = '';
      document.querySelector('#band-network-warning').innerText = '';
      document.querySelector('#band-server-warning').innerText = '';
      document.querySelector('#band-services-title').setAttribute('class', 'message-title');
      document.querySelector('#band-network-title').setAttribute('class', 'message-title');
      document.querySelector('#band-server-title').setAttribute('class', 'message-title');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check
      await checkCapabilities();
    }, INTERVAL_DURATION);

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


window.addEventListener('load', () => initCheck(), false);
window.addEventListener('unload', (event) => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});

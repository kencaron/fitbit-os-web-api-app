import * as messaging from "messaging";
import { preferences } from "user-settings";
import { settingsStorage } from "settings";

//TODO move to companion only utils
function kmToMi(ki) {
  return ki * 0.621371; 
}

function msToMin(ms) {
  return ms / 60000;
}

console.log("Companion Started");

//TODO firstDayOfWeek import { preferences } from "user-settings";
//preferences.firstDayOfWeek
function getLastMonday(date) {
  var day = date.getDay() || 7;
  if (day !== 1) {
    date.setHours(-24 * (day - 1));
  }
  return date;
}

function request(url, options) {
  console.log(`DEBUG: INCOMING REQUEST URL ${url}`);
  console.log(`DEBUG: INCOMING REQUEST TYPE ${options.method}`);
  console.log(`DEBUG: INCOMING REQUEST HAS AUTH HEADER ${options.headers.has('authorization')}`);
  if (!options.headers.has('authorization')) {
    return reject(401);
  }
  console.log(`DEBUG: INCOMING REQUEST AUTH HEADER ${options.headers.get('authorization')}`);

  return new Promise((resolve, reject) => {
    fetch(url, options)
      .then((response) => response.json())
      .then(responseJson => { 
        console.log('about to print responseJson')
        console.log(JSON.stringify(responseJson));

        if (responseJson.errors) {
          console.log('WE HAVE ERRORS');
          console.log(responseJson.errors[0].errorType);
          reject(responseJson.errors[0].errorType);
        } else {
          console.log('resolving');
          resolve(responseJson);
        }
      })
      .catch((error) => {
        console.log(`DEBUG: CATCH`);
        console.log(JSON.stringify(error));
        reject(error)
      });
  });
}

function formatDate(date) {
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}

function getActivities(access_token) {

  const afterDate = formatDate(getLastMonday(new Date()));
  console.log(`afterDate ${afterDate}`);
  return new Promise((resolve, reject) => {

    const requestUrl = `https://api.fitbit.com/1/user/-/activities/list.json?afterDate=${afterDate}&sort=desc&offset=0&limit=100`;
    const accept = 'application/x-www-form-urlencoded';
    const authorization = `Bearer ${access_token}`;
    const headers = {
      accept,
      authorization
    };
    console.log(`DEBUG HEADERS ${JSON.stringify(headers)}`);
    const requestOptions = {
      method: 'GET',
      headers: new Headers(headers)
    };

    request(requestUrl, requestOptions)
      .then(jsonResponse => {
        console.log('inside get activities then about to resolve');
        resolve(jsonResponse.activities)
      })
      .catch(err => {
        console.log('CATCH ON get activities. logging err:');
        console.log(err)
        console.log(JSON.stringify(err));

        reject(err)
      });
  });
}

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("Companion Socket Open");
  restoreSettings();

  const oauth = settingsStorage.getItem('oauth');

  if (oauth) {
    oauth = JSON.parse(oauth);
    console.log('OAUTH FROM COMPANION');
    console.log(oauth);
    const access_token = oauth.access_token;
    console.log('ACCESS TOKEN');
    if (access_token) {
      console.log('ACCESS TOKEN');
      console.log(access_token);
      useAccessToken(access_token);
    }
    
  }
};

function useAccessToken(access_token) {
  console.log('access_token method');
  console.log(access_token);
  getActivities(access_token)
    .then( activities => {
      console.log(activities.length);
    })
    .catch(err => {
      console.log(`DEBUG: CATCH`);
      console.log(JSON.stringify(err));
      sendVal({
        type: 'statusMessage',
        value: err
      });
    });
  
}

// Message socket closes
messaging.peerSocket.close = () => {
  console.log("Companion Socket Closed");
};

// Listen for the onerror event
messaging.peerSocket.onerror = (err) => {
  // Handle any errors
  console.log("Companion Connection error: " + err.code + " - " + err.message);
}

// A user changes settings
settingsStorage.onchange = evt => {
  console.log('companion: settings onchange');
  //Might be a bad idea
  if (evt.key && (evt.key === '__oauth')) evt.key = 'oauth;'
  
  console.log(JSON.stringify(evt));
  
  if (evt.key !== 'oauth') {
    let data = {
      key: evt.key,
      value: evt.newValue,
      type: 'setting'
    };
    sendVal(data);
  } else if (evt.newValue) {
    console.log('SETTING ONCHANGE WITH OAUTH KEY');
    const oauthResponse = JSON.parse(evt.newValue);
    console.log('OAUTH RESPONSE');
    console.log(JSON.stringify(oauthResponse));
    
    if (oauthResponse && oauthResponse.access_token) {
      console.log(JSON.stringify(oauthResponse.access_token));
      useAccessToken(oauthResponse.access_token);
    } else {
      console.log('CANNOT SEND FROM BAD OAUTH RESPONSE')
    }

  }
  
};

// Restore any previously saved settings and send to the device
function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    let key = settingsStorage.key(index);
    if (key) {
      let data = {
        type: 'setting',
        key: key,
        value: settingsStorage.getItem(key)
      };
      sendVal(data); 
    }
  }
}

// Send data to device using Messaging API
function sendVal(data) {
  
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log('SENDING FROM COMPANION TO PHONE');
    console.log(JSON.stringify(data));
    messaging.peerSocket.send(data);
  } else {
    console.log('CANNOT SEND TO WATCH' );
    console.log(messaging.peerSocket.readyState);
  }
  
}
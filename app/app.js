import clock from 'clock';
import document from 'document';
import { memory } from 'system'; 
import { me } from 'appbit';
import { display } from 'display';

import * as messaging from "messaging";

import { DEFAULT_SETTINGS } from './../common/constants.js'

export class App {
  constructor() {
    console.log('App Started!');
    console.log(JSON.stringify(DEFAULT_SETTINGS));
    
    
    
    

    DEFAULT_SETTINGS.forEach( setting => this.applySetting({data: setting}) );
    
    function updateMemoryMonitor() {
      const memoryJSPercent = Math.floor((memory.js.used / memory.js.total) * 100);
      const memoryNativePercent = Math.floor((memory.native.used / memory.native.total) * 100);

      console.log(`Memory Report - JS: ${memoryJSPercent}% Native ${memoryNativePercent}%`);     
    }
    
    memory.monitor.onmemorypressurechange = function() {
      updateMemoryMonitor();
    }; 
    updateMemoryMonitor();
    
    /* TODO ISOLATE THIS: MESSAGING SECTION */

    this.applyMessage({
      value: 'Waiting for WebSocket',
      timeout: 2000
    });
    console.log('READYSTATE:' + messaging.peerSocket.readyState);
    console.log(JSON.stringify(messaging.peerSocket.readyState));
    

    // Message is received
    messaging.peerSocket.onmessage = evt => {
      console.log(`App received: ${JSON.stringify(evt)}`);
      //{"data":{"key":"displayAlwaysOn","newValue":"true"}}
      if (evt.data.type === 'setting') {
        this.applySetting(evt);
      } else { //not a setting so treat it as a message //TODO tidy
        evt.data.timeout = 2000;
        this.applyMessage(evt.data);
      }
    };

    // Message socket opens
    messaging.peerSocket.onopen = () => {
      
      this.applyMessage({
        value: 'App Socket Opened',
        timeout: 2000
      });
    };

    // Message socket closes
    messaging.peerSocket.close = () => {
      const message = 'messaging.peerSocket.close fired';
      console.log(message);
      
      this.applyMessage({
        value: message,
        timeout: 2000,
        element: this.$statusBar
      });
    };
    
    // Listen for the onerror event
    messaging.peerSocket.onerror = (err) => {
      const message = `Companion Connection error: ${err.code} - ${err.message}`;
      console.log(message);
      this.applyMessage({
        value: message,
        timeout: 2000
      });
      
    }
    
    // register for the unload event
    me.onunload = () => {
      console.log("We're about to exit");
    }
    
    clock.granularity = 'seconds';
    clock.ontick = (evt) => {
      const hours = evt.date.getHours();
      const minutes = evt.date.getMinutes();
      const seconds = evt.date.getSeconds();
      const milliseconds = evt.date.getMilliseconds();
      //Once a second
      if (milliseconds === 0) {
        //DRAW THINGS
      }
      //Once a minute
      if (milliseconds === 0 && seconds === 0) {
        //DRAW THINGS
        updateMemoryMonitor();
      }
      //Once an hour
      if (milliseconds === 0 && seconds === 0 && minutes === 0) {
        //DRAW THINGS
      }
      //Once a day
      if (milliseconds === 0 && seconds === 0 && minutes === 0 && hours === 0) {
        //DRAW THINGS
      }
    }
    
    display.onchange = evt => {
      console.log(`Display changed: ${display.on ? 'On' : 'Off'}`);
      if (display.on) {
        
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
          this.applyMessage({
            value: 'App Socket Open',
            timeout: 2000
          });
        }
        if (messaging.peerSocket.readyState === messaging.peerSocket.CLOSED) {
          this.applyMessage({
            value: 'App Socket Closed',
            timeout: 2000
          });
          //Is there anything I do here to request messaging.peerSocket.onopen to fire?
         
        }
        
        const dateEvt = {
          date: new Date()
        };
      
        //DRAW THINGS
      }
    };
  }
  
  changePrimaryColor(color) {
    
    const evt = {
      date: new Date(),
      color: color
    };
    
    //DRAW THINGS
  }
  
  applyMessage(data) {
    console.log('Applying message');
    console.log(JSON.stringify(data));
    //TODO fix this to not use IDs if you can figure it out.
    const $text = document.getElementById('status-message-text');
    const $background = document.getElementById('status-bar-background');
    $text.innerText = data.value;
    $background.style.display = 'inline';

    setTimeout(()=> {
      $text.innerText = '';
      $background.style.display = 'none';
    }, data.timeout)
  }
  
  applySetting(evt) {
    console.log('applying setting');
    console.log(evt.data.key);
    console.log(evt.data.value);

      if (evt && evt.data && evt.data.key && evt.data.value) {
        display.on = true;
        
        switch (evt.data.key) {
          case 'color':
            this.applyMessage({
              value: 'Primary Color Updated',
              timeout: 2000
            });
            this.primaryColor = evt.data.value.replace(/['"]+/g, '');
            console.log(this.primaryColor);
            this.changePrimaryColor(this.primaryColor);
            break;
          case 'displayAlwaysOn':
            display.autoOff = evt.data.value === 'true' ? false : true;
            
            // this.applyMessage({
            //   value: display.autoOff ? 'Display Auto Off' : 'Display Always On',
            //   timeout: 2000
            // });
            
            break;
          case 'oauth':
            console.log('APP OAUTH');
            console.log(JSON.stringify(evt.data.value));
            if (!evt.data.value) {
              document.getElementById('status-message-text').innerText = "No OAuth token."
            }
            break;
        }
      }
  }
}
'use strict';

var Service, Characteristic;

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform("homebridge-fritz", "fritz", FritzPlatform);
}

var fritz = require('smartfritz-promise');

function FritzPlatform(log, config) {
  this.log = log;
  this.name = config["name"];
  this.host = config["host"];
  this.username = config["username"];
  this.password = config["password"];
}

FritzPlatform.prototype = {
  accessories: function(callback) {
    var that=this;
    var foundAccessories = [];

    //TODO: host!
    fritz.getSessionID(this.username, this.password).then(function(sid) {
      fritz.getSwitchList(sid).then(function(switches) {
        for (var ain of switches) {
          that.log("Switch  " + ain);
          foundAccessories.push(new FritzAccessory(that.log, that.host, that.username, that.password, ain));
        }
        callback(foundAccessories);
      });
/*
      // display switch information
        for (var ain of switches) {
          that.log("Switch  " + ain);
          foundAccessories.push(new FritzAccessory(that.log, that.host, that.username, that.password, ain));
        }
*/
    });
  }
}

function FritzAccessory(log, host, username, password, ain) {
  this.log = log;
  this.host = host;
  this.username = username;
  this.password = password;
  this.ain = ain;
  this.name = "Fritz " + ain;
}

FritzAccessory.prototype = {
  identify: function(callback) {
    this.log("Identify requested!");
    callback(); // success
  },
  getSwitchState: function (callback) {
    var that = this;
    fritz.getSessionID(this.username, this.password).then(function(sid) {
      fritz.getSwitchState(sid, that.ain).then(function(state) {
        that.log("Switch state [" + that.ain + "]: " + state);
        callback(error, null);
//        callback(null, response=="1");
       });
    });
  },
  setSwitchState: function(powerOn, callback) {
    var that = this;
    fritz.getSessionID(this.username, this.password).then(function(sid) {
      if(powerOn) {
        fritz.setSwitchOnState(sid, that.ain).then(function(state) {
          callback();
        });
      } else {
        fritz.setSwitchOffState(sid, that.ain).then(function(state) {
          callback();
        });
      }
    });
  },

  getServices: function() {
    var that = this;
    var services = [];

    this.log("creating services for " + this.name);

    // INFORMATION ///////////////////////////////////////////////////

    var informationService = new Service.AccessoryInformation();
    services.push( informationService );
    
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Fritz")
      .setCharacteristic(Characteristic.Model, "Fritz Model")

      .setCharacteristic(Characteristic.Name, this.name)

    // Switch //////////////////////////////////////////////////
    var switchService = new Service.Switch(this.name + " Switch");
    services.push( switchService );
    
    switchService.getCharacteristic(Characteristic.On)
      .on('get', this.getSwitchState.bind(this));
  
    switchService.getCharacteristic(Characteristic.On)
      .on('set', this.setSwitchState.bind(this));


/*

// get the total enery consumption. returns the value in Wh
module.exports.getSwitchEnergy = function(sid, ain, options);

// get the current enery consumption of an outlet. returns the value in mW
module.exports.getSwitchPower = function(sid, ain, options)

// get the outet presence status
module.exports.getSwitchPresence = function(sid, ain, options)

// get switch name
module.exports.getSwitchName = function(sid, ain, options)
*/

    return services;
  }

}


/**
 * @providesModule queryLayoutByID
 */
'use strict';

var UIManager = require('NativeModules').UIManager;

var queryLayoutByID = function(rootNodeID, onError, onSuccess) {
  UIManager.measure(rootNodeID, onSuccess);
};

module.exports = queryLayoutByID;

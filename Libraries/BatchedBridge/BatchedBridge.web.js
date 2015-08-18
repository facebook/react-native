/**
 * @providesModule BatchedBridge
 */
'use strict';

var warning = require('warning');

var BatchedBridge = {

  RemoteModules: {

    UIManager: {

      layoutAnimationDisabled: true,
      customBubblingEventTypes: {},
      customDirectEventTypes: {},
      Dimensions: {},

      RCTScrollView: {
        Constants: {},
      },

      measure: function(nodeID, onSuccess) {
        var rect = document.querySelector(`[data-reactid="${nodeID}"]`).getBoundingClientRect();
        onSuccess(rect.left, rect.top, rect.width, rect.height, rect.left, rect.top);
      },

      measureLayout: function(nodeHandle, relativeToNativeNode, onFail, onSuccess) {
        warning(false, "measureLayout() is not implemented on web");
      },

      configureNextLayoutAnimation: function(config, onAnimationDidEnd, onError) {
        if (onAnimationDidEnd) {
          onAnimationDidEnd();
        }
      },

    },

    AppState: {

      getCurrentAppState: function(callback) {
        if (window.Even_AppState) {
          return callback(JSON.parse(window.Even_AppState.getCurrentAppState()));
        } else {
          return callback('active');
        }
      },

    },

    PushNotificationManager: {

      scheduleLocalNotification: function(details) {},
      setApplicationIconBadgeNumber: function(number) {},
      getApplicationIconBadgeNumber: function(callback) {},

      requestPermissions: function(permissions) {
        if (window.Even_PushNotifications) {
          window.Even_PushNotifications.requestPermissions();
        }
      },

      abandonPermissions: function() {},

      checkPermissions: function(callback) {
        if (window.Even_PushNotifications) {
          callback(JSON.parse(window.Even_PushNotifications.checkPermissions()));
        } else {
          callback({});
        }
      },

    },

  },

};

module.exports = BatchedBridge;

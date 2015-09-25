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
        var nodeMeasure = nodeHandle.getDOMNode().getBoundingClientRect();
        var ancestorMeasure = relativeToNativeNode.getDOMNode().getBoundingClientRect();
        onSuccess(
          nodeMeasure.left - ancestorMeasure.left,
          nodeMeasure.top - ancestorMeasure.top,
          nodeMeasure.width,
          nodeMeasure.height,
        );
      },

      measureLayoutRelativeToParent: function(nodeHandle, onFail, onSuccess) {
        var node = nodeHandle.getDOMNode();
        var nodeMeasure = node.getBoundingClientRect();

        var ancestorMeasure = {left: 0, top: 0};
        if (!!node.parentElement) {
          ancestorMeasure = node.parentElement.getBoundingClientRect();
        }

        onSuccess(
          nodeMeasure.left - ancestorMeasure.left,
          nodeMeasure.top - ancestorMeasure.top,
          nodeMeasure.width,
          nodeMeasure.height,
        );
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
          window.setTimeout(function() {
            callback(JSON.parse(window.Even_PushNotifications.checkPermissions()));
          }, 0);
        } else {
          window.setTimeout(function() {
            callback({});
          }, 0);
        }
      },

    },

    ActionSheetManager: {

      showShareActionSheetWithOptions: function(options, failureCallback, successCallback) {
        if (window.Even_Sharing) {
          window.Even_Sharing.share(options.message || options.url);
          successCallback();
        } else {
          console.error('Not supported on this platform');
        }
      },

      showActionSheetWithOptions: function(options, failureCallback, successCallback) {
        console.error('Not supported on this platform');
      },

    },

  },

};

module.exports = BatchedBridge;

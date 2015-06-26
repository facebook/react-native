/**
 * @providesModule BatchedBridge
 */
'use strict';

var warning = require('warning');

var BatchedBridge = {

  RemoteModules: {
        
    UIManager: {

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

  },

};

module.exports = BatchedBridge;

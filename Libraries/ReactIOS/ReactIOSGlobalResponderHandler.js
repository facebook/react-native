/**
 * @providesModule ReactIOSGlobalResponderHandler
 */
'use strict';

var RKUIManager = require('NativeModules').RKUIManager;
var ReactIOSTagHandles = require('ReactIOSTagHandles');

var ReactIOSGlobalResponderHandler = {
  onChange: function(from, to) {
    if (to !== null) {
      RKUIManager.setJSResponder(
        ReactIOSTagHandles.mostRecentMountedNodeHandleForRootNodeID(to)
      );
    } else {
      RKUIManager.clearJSResponder();
    }
  }
};

module.exports = ReactIOSGlobalResponderHandler;

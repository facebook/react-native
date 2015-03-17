/**
 * @providesModule ReactIOSGlobalResponderHandler
 */
'use strict';

var RCTUIManager = require('NativeModules').RCTUIManager;
var ReactIOSTagHandles = require('ReactIOSTagHandles');

var ReactIOSGlobalResponderHandler = {
  onChange: function(from, to) {
    if (to !== null) {
      RCTUIManager.setJSResponder(
        ReactIOSTagHandles.mostRecentMountedNodeHandleForRootNodeID(to)
      );
    } else {
      RCTUIManager.clearJSResponder();
    }
  }
};

module.exports = ReactIOSGlobalResponderHandler;

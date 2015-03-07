/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOSTextComponent
 */

'use strict';

var ReactIOSTagHandles = require('ReactIOSTagHandles');
var RKUIManager = require('NativeModulesDeprecated').RKUIManager;

var assign = require('Object.assign');

var ReactIOSTextComponent = function(props) {
  // This constructor and its argument is currently used by mocks.
};

assign(ReactIOSTextComponent.prototype, {

  construct: function(text) {
    // This is really a ReactText (ReactNode), not a ReactElement
    this._currentElement = text;
    this._stringText = '' + text;
    this._rootNodeID = null;
  },

  mountComponent: function(rootID, transaction, context) {
    this._rootNodeID = rootID;
    var tag = ReactIOSTagHandles.allocateTag();
    RKUIManager.createView(tag, 'RCTRawText', {text: this._stringText});
    return {
      rootNodeID: rootID,
      tag: tag,
    };
  },

  receiveComponent: function(nextText, transaction, context) {
    if (nextText !== this._currentElement) {
      this._currentElement = nextText;
      var nextStringText = '' + nextText;
      if (nextStringText !== this._stringText) {
        this._stringText = nextStringText;
        RKUIManager.updateView(
          ReactIOSTagHandles.mostRecentMountedNodeHandleForRootNodeID(
            this._rootNodeID
          ),
          'RCTRawText',
          {text: this._stringText}
        );
      }
    }
  },

  unmountComponent: function() {
    this._currentElement = null;
    this._stringText = null;
    this._rootNodeID = null;
  }

});

module.exports = ReactIOSTextComponent;

/**
 * @providesModule ReactIOSGlobalInteractionHandler
 */
'use strict';

var InteractionManager = require('InteractionManager');

// Interaction handle is created/cleared when responder is granted or
// released/terminated.
var interactionHandle = null;

var ReactIOSGlobalInteractionHandler = {
  onChange: function(numberActiveTouches) {
    if (numberActiveTouches === 0) {
      if (interactionHandle) {
        InteractionManager.clearInteractionHandle(interactionHandle);
        interactionHandle = null;
      }
    } else if (!interactionHandle) {
      interactionHandle = InteractionManager.createInteractionHandle();
    }
  }
};

module.exports = ReactIOSGlobalInteractionHandler;

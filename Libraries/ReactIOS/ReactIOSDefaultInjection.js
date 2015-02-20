/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOSDefaultInjection
 */

"use strict";

/**
 * Make sure `setTimeout`/`setInterval` are patched correctly.
 */
require('InitializeJavaScriptAppEngine');
var EventPluginHub = require('EventPluginHub');
var EventPluginUtils = require('EventPluginUtils');
var IOSDefaultEventPluginOrder = require('IOSDefaultEventPluginOrder');
var IOSNativeBridgeEventPlugin = require('IOSNativeBridgeEventPlugin');
var NodeHandle = require('NodeHandle');
var ReactComponent = require('ReactComponent');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactElement = require('ReactElement');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactIOSComponentEnvironment = require('ReactIOSComponentEnvironment');
var ReactIOSComponentMixin = require('ReactIOSComponentMixin');
var ReactIOSGlobalInteractionHandler = require('ReactIOSGlobalInteractionHandler');
var ReactIOSGlobalResponderHandler = require('ReactIOSGlobalResponderHandler');
var ReactIOSMount = require('ReactIOSMount');
var ReactTextComponent = require('ReactTextComponent');
var ReactUpdates = require('ReactUpdates');
var ResponderEventPlugin = require('ResponderEventPlugin');
var RKRawText = require('RKRawText');
var UniversalWorkerNodeHandle = require('UniversalWorkerNodeHandle');

// Just to ensure this gets packaged, since its only caller is from Native.
require('RCTEventEmitter');
require('RCTLog');
require('RCTJSTimers');

function inject() {
  /**
   * Inject module for resolving DOM hierarchy and plugin ordering.
   */
  EventPluginHub.injection.injectEventPluginOrder(IOSDefaultEventPluginOrder);
  EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);

  ResponderEventPlugin.injection.injectGlobalResponderHandler(
    ReactIOSGlobalResponderHandler
  );

  ResponderEventPlugin.injection.injectGlobalInteractionHandler(
    ReactIOSGlobalInteractionHandler
  );

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  EventPluginHub.injection.injectEventPluginsByName({
    'ResponderEventPlugin': ResponderEventPlugin,
    'IOSNativeBridgeEventPlugin': IOSNativeBridgeEventPlugin
  });

  ReactUpdates.injection.injectReconcileTransaction(
    ReactIOSComponentEnvironment.ReactReconcileTransaction
  );

  ReactUpdates.injection.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactComponent.injection.injectEnvironment(
    ReactIOSComponentEnvironment
  );

  EventPluginUtils.injection.injectMount(ReactIOSMount);

  ReactCompositeComponent.injection.injectMixin(ReactIOSComponentMixin);

  ReactTextComponent.inject(function(initialText) {
    // RKRawText is a class so we can't invoke it directly. Instead of using
    // a factory, we use the internal fast path to create a descriptor.
    // RKRawText is not quite a class yet, so we access the real class from
    // the type property. TODO: Change this once factory wrappers are gone.
    return new ReactElement(RKRawText.type, null, null, null, null, {
      text: initialText
    });
  });

  NodeHandle.injection.injectImplementation(UniversalWorkerNodeHandle);
}

module.exports = {
  inject: inject,
};

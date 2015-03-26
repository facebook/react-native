/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactIOSDefaultInjection
 * @flow
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
var ReactClass = require('ReactClass');
var ReactComponentEnvironment = require('ReactComponentEnvironment');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactIOSComponentEnvironment = require('ReactIOSComponentEnvironment');
var ReactIOSComponentMixin = require('ReactIOSComponentMixin');
var ReactIOSGlobalInteractionHandler = require('ReactIOSGlobalInteractionHandler');
var ReactIOSGlobalResponderHandler = require('ReactIOSGlobalResponderHandler');
var ReactIOSMount = require('ReactIOSMount');
var ReactIOSTextComponent = require('ReactIOSTextComponent');
var ReactNativeComponent = require('ReactNativeComponent');
var ReactUpdates = require('ReactUpdates');
var ResponderEventPlugin = require('ResponderEventPlugin');
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

  ReactComponentEnvironment.injection.injectEnvironment(
    ReactIOSComponentEnvironment
  );

  EventPluginUtils.injection.injectMount(ReactIOSMount);

  ReactClass.injection.injectMixin(ReactIOSComponentMixin);

  ReactNativeComponent.injection.injectTextComponentClass(
    ReactIOSTextComponent
  );

  NodeHandle.injection.injectImplementation(UniversalWorkerNodeHandle);
}

module.exports = {
  inject: inject,
};

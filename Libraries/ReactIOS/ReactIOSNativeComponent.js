/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactIOSNativeComponent
 * @flow
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var ReactIOSComponentMixin = require('ReactIOSComponentMixin');
var ReactIOSEventEmitter = require('ReactIOSEventEmitter');
var ReactIOSStyleAttributes = require('ReactIOSStyleAttributes');
var ReactIOSTagHandles = require('ReactIOSTagHandles');
var ReactMultiChild = require('ReactMultiChild');
var RCTUIManager = require('NativeModules').UIManager;

var styleDiffer = require('styleDiffer');
var deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');
var diffRawProperties = require('diffRawProperties');
var flattenStyle = require('flattenStyle');
var warning = require('warning');

var registrationNames = ReactIOSEventEmitter.registrationNames;
var putListener = ReactIOSEventEmitter.putListener;
var deleteAllListeners = ReactIOSEventEmitter.deleteAllListeners;

type ReactIOSNativeComponentViewConfig = {
  validAttributes: Object;
  uiViewClassName: string;
}

/**
 * @constructor ReactIOSNativeComponent
 * @extends ReactComponent
 * @extends ReactMultiChild
 * @param {!object} UIKit View Configuration.
 */
var ReactIOSNativeComponent = function(
  viewConfig: ReactIOSNativeComponentViewConfig
) {
  this.viewConfig = viewConfig;
};

/**
 * Generates and caches arrays of the form:
 *
 *    [0, 1, 2, 3]
 *    [0, 1, 2, 3, 4]
 *    [0, 1]
 *
 * @param {number} size Size of array to generate.
 * @return {Array<number>} Array with values that mirror the index.
 */
var cachedIndexArray = function(size) {
  var cachedResult = cachedIndexArray._cache[size];
  if (!cachedResult) {
    var arr = [];
    for (var i = 0; i < size; i++) {
      arr[i] = i;
    }
    return cachedIndexArray._cache[size] = arr;
  } else {
    return cachedResult;
  }
};
cachedIndexArray._cache = {};

/**
 * Mixin for containers that contain UIViews. NOTE: markup is rendered markup
 * which is a `viewID` ... see the return value for `mountComponent` !
 */
ReactIOSNativeComponent.Mixin = {
  getPublicInstance: function() {
    // TODO: This should probably use a composite wrapper
    return this;
  },

  construct: function(element) {
    this._currentElement = element;
  },

  unmountComponent: function() {
    deleteAllListeners(this._rootNodeID);
    this.unmountChildren();
    this._rootNodeID = null;
  },

  /**
   * Every native component is responsible for allocating its own `tag`, and
   * issuing the native `createView` command. But it is not responsible for
   * recording the fact that its own `rootNodeID` is associated with a
   * `nodeHandle`. Only the code that actually adds its `nodeHandle` (`tag`) as
   * a child of a container can confidently record that in
   * `ReactIOSTagHandles`.
   */
  initializeChildren: function(children, containerTag, transaction, context) {
    var mountImages = this.mountChildren(children, transaction, context);
    // In a well balanced tree, half of the nodes are in the bottom row and have
    // no children - let's avoid calling out to the native bridge for a large
    // portion of the children.
    if (mountImages.length) {
      var indexes = cachedIndexArray(mountImages.length);
      // TODO: Pool these per platform view class. Reusing the `mountImages`
      // array would likely be a jit deopt.
      var createdTags = [];
      for (var i = 0; i < mountImages.length; i++) {
        var mountImage = mountImages[i];
        var childTag = mountImage.tag;
        var childID = mountImage.rootNodeID;
        warning(
          mountImage && mountImage.rootNodeID && mountImage.tag,
          'Mount image returned does not have required data'
        );
        ReactIOSTagHandles.associateRootNodeIDWithMountedNodeHandle(
          childID,
          childTag
        );
        createdTags[i] = mountImage.tag;
      }
      RCTUIManager
        .manageChildren(containerTag, null, null, createdTags, indexes, null);
    }
  },


  /**
   * Beware, this function has side effect to store this.previousFlattenedStyle!
   *
   * @param {!object} prevProps Previous properties
   * @param {!object} nextProps Next properties
   * @param {!object} validAttributes Set of valid attributes and how they
   *                  should be diffed
   */
  computeUpdatedProperties: function(prevProps, nextProps, validAttributes) {
    if (__DEV__) {
      for (var key in nextProps) {
        if (nextProps.hasOwnProperty(key) &&
            nextProps[key] &&
            validAttributes[key]) {
          deepFreezeAndThrowOnMutationInDev(nextProps[key]);
        }
      }
    }

    var updatePayload = diffRawProperties(
      null, // updatePayload
      prevProps,
      nextProps,
      validAttributes
    );

    // The style property is a deeply nested element which includes numbers
    // to represent static objects. Most of the time, it doesn't change across
    // renders, so it's faster to spend the time checking if it is different
    // before actually doing the expensive flattening operation in order to
    // compute the diff.
    if (styleDiffer(nextProps.style, prevProps.style)) {
      var nextFlattenedStyle = flattenStyle(nextProps.style);
      updatePayload = diffRawProperties(
        updatePayload,
        this.previousFlattenedStyle,
        nextFlattenedStyle,
        ReactIOSStyleAttributes
      );
      this.previousFlattenedStyle = nextFlattenedStyle;
    }

    return updatePayload;
  },


  /**
   * Updates the component's currently mounted representation.
   *
   * @param {object} nextElement
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @internal
   */
  receiveComponent: function(nextElement, transaction, context) {
    var prevElement = this._currentElement;
    this._currentElement = nextElement;

    var updatePayload = this.computeUpdatedProperties(
      prevElement.props,
      nextElement.props,
      this.viewConfig.validAttributes
    );

    if (updatePayload) {
      RCTUIManager.updateView(
        ReactIOSTagHandles.mostRecentMountedNodeHandleForRootNodeID(this._rootNodeID),
        this.viewConfig.uiViewClassName,
        updatePayload
      );
    }

    this._reconcileListenersUponUpdate(
      prevElement.props,
      nextElement.props
    );
    this.updateChildren(nextElement.props.children, transaction, context);
  },

  /**
   * @param {object} initialProps Native component props.
   */
  _registerListenersUponCreation: function(initialProps) {
    for (var key in initialProps) {
      // NOTE: The check for `!props[key]`, is only possible because this method
      // registers listeners the *first* time a component is created.
      if (registrationNames[key] && initialProps[key]) {
        var listener = initialProps[key];
        putListener(this._rootNodeID, key, listener);
      }
    }
  },

  /**
   * Reconciles event listeners, adding or removing if necessary.
   * @param {object} prevProps Native component props including events.
   * @param {object} nextProps Next native component props including events.
   */
  _reconcileListenersUponUpdate: function(prevProps, nextProps) {
    for (var key in nextProps) {
      if (registrationNames[key] && (nextProps[key] != prevProps[key])) {
        putListener(this._rootNodeID, key, nextProps[key]);
      }
    }
  },

  /**
   * @param {string} rootID Root ID of this subtree.
   * @param {Transaction} transaction For creating/updating.
   * @return {string} Unique iOS view tag.
   */
  mountComponent: function(rootID, transaction, context) {
    this._rootNodeID = rootID;

    var tag = ReactIOSTagHandles.allocateTag();

    this.previousFlattenedStyle = {};
    var updatePayload = this.computeUpdatedProperties(
      {}, // previous props
      this._currentElement.props, // next props
      this.viewConfig.validAttributes
    );
    RCTUIManager.createView(tag, this.viewConfig.uiViewClassName, updatePayload);

    this._registerListenersUponCreation(this._currentElement.props);
    this.initializeChildren(
      this._currentElement.props.children,
      tag,
      transaction,
      context
    );
    return {
      rootNodeID: rootID,
      tag: tag
    };
  }
};

/**
 * Order of mixins is important. ReactIOSNativeComponent overrides methods in
 * ReactMultiChild.
 */
Object.assign(
  ReactIOSNativeComponent.prototype,
  ReactMultiChild.Mixin,
  ReactIOSNativeComponent.Mixin,
  NativeMethodsMixin,
  ReactIOSComponentMixin
);

module.exports = ReactIOSNativeComponent;

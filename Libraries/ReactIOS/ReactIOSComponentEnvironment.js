/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOSComponentEnvironment
 */
'use strict';
var RKUIManager = require('NativeModulesDeprecated').RKUIManager;

var ReactIOSDOMIDOperations = require('ReactIOSDOMIDOperations');
var ReactIOSReconcileTransaction = require('ReactIOSReconcileTransaction');
var ReactIOSTagHandles = require('ReactIOSTagHandles');
var ReactPerf = require('ReactPerf');

var ReactIOSComponentEnvironment = {

  /**
   * Will need to supply something that implements this.
   */
  BackendIDOperations: ReactIOSDOMIDOperations,

  /**
   * Nothing to do for UIKit bridge.
   *
   * @private
   */
  unmountIDFromEnvironment: function(/*rootNodeID*/) {

  },

  /**
   * @param {DOMElement} Element to clear.
   */
  clearNode: function(/*containerView*/) {

  },

  /**
   * @param {View} view View tree image.
   * @param {number} containerViewID View to insert sub-view into.
   */
  mountImageIntoNode: ReactPerf.measure(
    // FIXME(frantic): #4441289 Hack to avoid modifying react-tools
    'ReactComponentBrowserEnvironment',
    'mountImageIntoNode',
    function(mountImage, containerID) {
      // Since we now know that the `mountImage` has been mounted, we can
      // mark it as such.
      ReactIOSTagHandles.associateRootNodeIDWithMountedNodeHandle(
        mountImage.rootNodeID,
        mountImage.tag
      );
      var addChildTags = [mountImage.tag];
      var addAtIndices = [0];
      RKUIManager.manageChildren(
        ReactIOSTagHandles.mostRecentMountedNodeHandleForRootNodeID(containerID),
        null,         // moveFromIndices
        null,         // moveToIndices
        addChildTags,
        addAtIndices,
        null          // removeAtIndices
      );
    }
  ),

  ReactReconcileTransaction: ReactIOSReconcileTransaction,
};

module.exports = ReactIOSComponentEnvironment;

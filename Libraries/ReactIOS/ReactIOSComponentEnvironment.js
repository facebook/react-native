/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOSComponentEnvironment
 */
'use strict';

var ReactIOSDOMIDOperations = require('ReactIOSDOMIDOperations');
var ReactIOSReconcileTransaction = require('ReactIOSReconcileTransaction');

var ReactIOSComponentEnvironment = {

  processChildrenUpdates: ReactIOSDOMIDOperations.dangerouslyProcessChildrenUpdates,

  replaceNodeWithMarkupByID: ReactIOSDOMIDOperations.dangerouslyReplaceNodeWithMarkupByID,

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

  ReactReconcileTransaction: ReactIOSReconcileTransaction,
};

module.exports = ReactIOSComponentEnvironment;

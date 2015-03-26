/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactIOSComponentEnvironment
 * @flow
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

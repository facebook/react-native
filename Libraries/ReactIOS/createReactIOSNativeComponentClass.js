/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createReactIOSNativeComponentClass
 * @flow
 */

"use strict";

var ReactElement = require('ReactElement');
var ReactIOSNativeComponent = require('ReactIOSNativeComponent');

// See also ReactIOSNativeComponent
type ReactIOSNativeComponentViewConfig = {
  validAttributes: Object;
  uiViewClassName: string;
}

/**
 * @param {string} config iOS View configuration.
 * @private
 */
var createReactIOSNativeComponentClass = function(
  viewConfig: ReactIOSNativeComponentViewConfig
): Function { // returning Function is lossy :/
  var Constructor = function(element) {
    this._currentElement = element;

    this._rootNodeID = null;
    this._renderedChildren = null;
    this.previousFlattenedStyle = null;
  };
  Constructor.displayName = viewConfig.uiViewClassName;
  Constructor.prototype = new ReactIOSNativeComponent(viewConfig);

  return Constructor;
};

module.exports = createReactIOSNativeComponentClass;

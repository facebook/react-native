/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule createReactIOSNativeComponentClass
 */

"use strict";

var ReactElement = require('ReactElement');
var ReactIOSNativeComponent = require('ReactIOSNativeComponent');

/**
 * @param {string} config iOS View configuration.
 * @private
 */
var createReactIOSNativeComponentClass = function(viewConfig) {
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

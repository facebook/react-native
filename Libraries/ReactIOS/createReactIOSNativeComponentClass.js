/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule createReactIOSNativeComponentClass
 */

"use strict";

var ReactElement = require('ReactElement');
var ReactLegacyElement = require('ReactLegacyElement');
var ReactIOSNativeComponent = require('ReactIOSNativeComponent');

/**
 * @param {string} config iOS View configuration.
 * @private
 */
var createReactIOSNativeComponentClass = function(viewConfig) {
  var Constructor = function(props) {
  };
  Constructor.displayName = viewConfig.uiViewClassName;
  Constructor.prototype = new ReactIOSNativeComponent(viewConfig);
  Constructor.prototype.constructor = Constructor;

  return ReactLegacyElement.wrapFactory(
    ReactElement.createFactory(Constructor)
  );
};

module.exports = createReactIOSNativeComponentClass;

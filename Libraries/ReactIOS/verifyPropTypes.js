/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule verifyPropTypes
 * @flow
 */
'use strict';

var ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
var View = require('View');

function verifyPropTypes(
  component: Function,
  viewConfig: Object,
  nativePropsToIgnore?: Object
) {
  if (!viewConfig) {
    return; // This happens for UnimplementedView.
  }
  var componentName = component.name || component.displayName;
  if (!component.propTypes) {
    throw new Error(
      '`' + componentName + '` has no propTypes defined`'
    );
  }

  var nativeProps = viewConfig.NativeProps;
  for (var prop in nativeProps) {
    if (!component.propTypes[prop] &&
        !View.propTypes[prop] &&
        !ReactNativeStyleAttributes[prop] &&
        (!nativePropsToIgnore || !nativePropsToIgnore[prop])) {
      throw new Error(
        '`' + componentName + '` has no propType for native prop `' +
        viewConfig.uiViewClassName + '.' + prop + '` of native type `' +
        nativeProps[prop] + '`'
      );
    }
  }
}

module.exports = verifyPropTypes;

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

var ReactIOSStyleAttributes = require('ReactIOSStyleAttributes');
var View = require('View');

function verifyPropTypes(
  component: Function,
  viewConfig: Object,
  nativePropsToIgnore?: Object
) {
  if (!viewConfig) {
    return; // This happens for UnimplementedView.
  }
  var nativeProps = viewConfig.nativeProps;
  for (var prop in nativeProps) {
    if (!component.propTypes[prop] &&
        !View.propTypes[prop] &&
        !ReactIOSStyleAttributes[prop] &&
        (!nativePropsToIgnore || !nativePropsToIgnore[prop])) {
      throw new Error(
        '`' + component.displayName + '` has no propType for native prop `' +
        viewConfig.uiViewClassName + '.' + prop + '` of native type `' +
        nativeProps[prop].type + '`'
      );
    }
  }
}

module.exports = verifyPropTypes;

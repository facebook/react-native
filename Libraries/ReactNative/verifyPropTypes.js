/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

var ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');

export type ComponentInterface =
  | React$ComponentType<any>
  | {
      name?: string,
      displayName?: string,
      propTypes?: Object,
    };

function verifyPropTypes(
  componentInterface: ComponentInterface,
  viewConfig: Object,
  nativePropsToIgnore?: ?Object,
) {
  if (!viewConfig) {
    return; // This happens for UnimplementedView.
  }
  var componentName =
    componentInterface.displayName || componentInterface.name || 'unknown';

  var propTypes = componentInterface.propTypes;

  if (!propTypes) {
    return;
  }

  var nativeProps = viewConfig.NativeProps;
  for (var prop in nativeProps) {
    if (
      !propTypes[prop] &&
      !ReactNativeStyleAttributes[prop] &&
      (!nativePropsToIgnore || !nativePropsToIgnore[prop])
    ) {
      var message;
      if (propTypes.hasOwnProperty(prop)) {
        message =
          '`' +
          componentName +
          '` has incorrectly defined propType for native prop `' +
          viewConfig.uiViewClassName +
          '.' +
          prop +
          '` of native type `' +
          nativeProps[prop];
      } else {
        message =
          '`' +
          componentName +
          '` has no propType for native prop `' +
          viewConfig.uiViewClassName +
          '.' +
          prop +
          '` of native type `' +
          nativeProps[prop] +
          '`';
      }
      message +=
        "\nIf you haven't changed this prop yourself, this usually means that " +
        'your versions of the native code and JavaScript code are out of sync. Updating both ' +
        'should make this error go away.';
      throw new Error(message);
    }
  }
}

module.exports = verifyPropTypes;

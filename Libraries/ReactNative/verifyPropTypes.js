/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');

function verifyPropTypes(
  viewConfig: $ReadOnly<{
    NativeProps: $ReadOnly<{
      [propName: string]: mixed,
    }>,
    propTypes: ?$ReadOnly<{
      [propName: string]: mixed,
    }>,
    uiViewClassName: string,
  }>,
  nativePropsToIgnore: ?$ReadOnly<{
    [propName: string]: boolean,
  }>,
) {
  const {NativeProps, propTypes, uiViewClassName} = viewConfig;

  if (propTypes == null) {
    return;
  }

  for (const propName in NativeProps) {
    if (
      propTypes[propName] ||
      ReactNativeStyleAttributes[propName] ||
      (nativePropsToIgnore && nativePropsToIgnore[propName])
    ) {
      continue;
    }
    const prettyName = `${uiViewClassName}.${propName}`;
    const nativeType = String(NativeProps[propName]);
    const suggestion =
      '\n\nIf you have not changed this prop yourself, this usually means ' +
      'that the versions of your native and JavaScript code are out of sync. ' +
      'Updating both should make this error go away.';

    if (propTypes.hasOwnProperty(propName)) {
      console.error(
        `Invalid propType to configure \`${prettyName}\` (${nativeType}).` +
          suggestion,
      );
    } else {
      console.error(
        `Missing a propType to configure \`${prettyName}\` (${nativeType}).` +
          suggestion,
      );
    }
  }
}

module.exports = verifyPropTypes;

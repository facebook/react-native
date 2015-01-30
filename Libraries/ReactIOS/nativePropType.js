/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule nativePropType
 */
'use strict'

/**
 * A simple wrapper for prop types to mark them as native, which will allow them
 * to be passed over the bridge to be applied to the native component if
 * processed by `validAttributesFromPropTypes`.
 */
function nativePropType(propType) {
  propType.isNative = true;
  return propType;
}

module.exports = nativePropType;

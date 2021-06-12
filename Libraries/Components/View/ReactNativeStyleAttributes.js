/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format strict-local
 * @flow
 */

import DeprecatedImageStylePropTypes from '../../DeprecatedPropTypes/DeprecatedImageStylePropTypes';
import DeprecatedTextStylePropTypes from '../../DeprecatedPropTypes/DeprecatedTextStylePropTypes';
import DeprecatedViewStylePropTypes from '../../DeprecatedPropTypes/DeprecatedViewStylePropTypes';
import type {AnyAttributeType} from '../../Renderer/shims/ReactNativeTypes';
import processColor from '../../StyleSheet/processColor';
import processTransform from '../../StyleSheet/processTransform';
import sizesDiffer from '../../Utilities/differ/sizesDiffer';

const ReactNativeStyleAttributes: {[string]: AnyAttributeType} = {};

for (const attributeName of Object.keys({
  ...DeprecatedViewStylePropTypes,
  ...DeprecatedTextStylePropTypes,
  ...DeprecatedImageStylePropTypes,
})) {
  ReactNativeStyleAttributes[attributeName] = true;
}

ReactNativeStyleAttributes.transform = {process: processTransform};
ReactNativeStyleAttributes.shadowOffset = {diff: sizesDiffer};

const colorAttributes = {process: processColor};
ReactNativeStyleAttributes.backgroundColor = colorAttributes;
ReactNativeStyleAttributes.borderBottomColor = colorAttributes;
ReactNativeStyleAttributes.borderColor = colorAttributes;
ReactNativeStyleAttributes.borderLeftColor = colorAttributes;
ReactNativeStyleAttributes.borderRightColor = colorAttributes;
ReactNativeStyleAttributes.borderTopColor = colorAttributes;
ReactNativeStyleAttributes.borderStartColor = colorAttributes;
ReactNativeStyleAttributes.borderEndColor = colorAttributes;
ReactNativeStyleAttributes.color = colorAttributes;
ReactNativeStyleAttributes.shadowColor = colorAttributes;
ReactNativeStyleAttributes.textDecorationColor = colorAttributes;
ReactNativeStyleAttributes.tintColor = colorAttributes;
ReactNativeStyleAttributes.textShadowColor = colorAttributes;
ReactNativeStyleAttributes.overlayColor = colorAttributes;

module.exports = ReactNativeStyleAttributes;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {____FlattenStyleProp_Internal} from './StyleSheetTypes';

const propMap = {
  marginInlineStart: 'marginStart',
  marginInlineEnd: 'marginEnd',
  marginBlockStart: 'marginTop',
  marginBlockEnd: 'marginBottom',
  marginBlock: 'marginVertical',
  marginInline: 'marginHorizontal',
  paddingInlineStart: 'paddingStart',
  paddingInlineEnd: 'paddingEnd',
  paddingBlockStart: 'paddingTop',
  paddingBlockEnd: 'paddingBottom',
  paddingBlock: 'paddingVertical',
  paddingInline: 'paddingHorizontal',
  verticalAlign: 'textAlignVertical',
};

const verticalAlignValueMap = {
  auto: 'auto',
  top: 'top',
  bottom: 'bottom',
  middle: 'center',
};

function processStyles<T>(
  flattenedStyle: ____FlattenStyleProp_Internal<T>,
): ____FlattenStyleProp_Internal<T> {
  const _flattenedStyle = {...flattenedStyle};

  if (_flattenedStyle != null) {
    Object.keys(_flattenedStyle).forEach(key => {
      const alt = propMap[key];
      const originalValue = _flattenedStyle[key];
      let _value = originalValue;
      if (key === 'verticalAlign') {
        _value = verticalAlignValueMap[originalValue];
      }
      if (alt != null) {
        delete _flattenedStyle[key];
        _flattenedStyle[alt] = _value;
      }
    });
  }

  return _flattenedStyle;
}

module.exports = processStyles;

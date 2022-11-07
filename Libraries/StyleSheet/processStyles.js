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

function processLayoutProps<T>(
  flattenedStyle: ____FlattenStyleProp_Internal<T>,
): ____FlattenStyleProp_Internal<T> {
  const _flattenedStyle = {...flattenedStyle};
  const layoutPropMap = {
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
  };
  if (_flattenedStyle) {
    Object.keys(layoutPropMap).forEach(key => {
      if (_flattenedStyle && _flattenedStyle[key] !== undefined) {
        _flattenedStyle[layoutPropMap[key]] = _flattenedStyle[key];
        delete _flattenedStyle[key];
      }
    });
  }

  return _flattenedStyle;
}

module.exports = processLayoutProps;

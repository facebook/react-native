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
import type {ViewStyleProp} from './StyleSheet';

export default function processLayoutProps(
  flattendStyle: ____FlattenStyleProp_Internal<ViewStyleProp>,
): ____FlattenStyleProp_Internal<ViewStyleProp> {
  const flattend_Style = {...flattendStyle};
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
  if (flattend_Style) {
    Object.keys(layoutPropMap).forEach(key => {
      if (flattend_Style && flattend_Style[key] !== undefined) {
        flattend_Style[layoutPropMap[key]] = flattend_Style[key];
        delete flattend_Style[key];
      }
    });
  }

  return flattend_Style;
}

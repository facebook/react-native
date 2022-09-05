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

import type {ViewStyleProp} from './StyleSheet';

import flattenStyle from './flattenStyle';

export default function processLayoutProps(
  style: ViewStyleProp,
): ViewStyleProp {
  let processedStyle = flattenStyle(style);

  const layoutPropMap = {
    marginInlineStart: 'marginStart',
    marginInlineEnd: 'marginEnd',
    marginBlockStart: 'marginTop',
    marginBlockEnd: 'marginBottom',
    paddingInlineStart: 'paddingStart',
    paddingInlineEnd: 'paddingEnd',
    paddingBlockStart: 'paddingTop',
    paddingBlockEnd: 'paddingBottom',
  };

  Object.keys(layoutPropMap).forEach(key => {
    if (processedStyle && processedStyle[key] !== undefined) {
      processedStyle[layoutPropMap[key]] = processedStyle[key];
      delete processedStyle[key];
    }
  });

  return processedStyle;
}

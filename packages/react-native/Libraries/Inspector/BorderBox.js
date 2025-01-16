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

import type {ViewStyleProp} from '../StyleSheet/StyleSheet';

import React from 'react';

const View = require('../Components/View/View');

type Props = $ReadOnly<{
  children: React.Node,
  box?: ?$ReadOnly<{
    top: number,
    right: number,
    bottom: number,
    left: number,
    ...
  }>,
  style?: ViewStyleProp,
}>;

function BorderBox({children, box, style}: Props): React.Node {
  if (!box) {
    return children;
  }
  const borderStyle = {
    borderTopWidth: box.top,
    borderBottomWidth: box.bottom,
    borderLeftWidth: box.left,
    borderRightWidth: box.right,
  };
  return <View style={[borderStyle, style]}>{children}</View>;
}

module.exports = BorderBox;

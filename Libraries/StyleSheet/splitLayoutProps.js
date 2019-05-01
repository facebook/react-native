/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {DangerouslyImpreciseStyle} from 'StyleSheet';

const OUTER_PROPS = {
  margin: true,
  marginHorizontal: true,
  marginVertical: true,
  marginBottom: true,
  marginTop: true,
  marginLeft: true,
  marginRight: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  flexBasis: true,
  alignSelf: true,
  height: true,
  minHeight: true,
  maxHeight: true,
  width: true,
  minWidth: true,
  maxWidth: true,
  position: true,
  left: true,
  right: true,
  bottom: true,
  top: true,
};

function splitLayoutProps(
  props: DangerouslyImpreciseStyle,
): {
  outer: DangerouslyImpreciseStyle,
  inner: DangerouslyImpreciseStyle,
} {
  const inner = {};
  const outer = {};
  Object.keys(props).forEach(k => {
    if (OUTER_PROPS[k] === true) {
      outer[k] = props[k];
    } else {
      inner[k] = props[k];
    }
  });
  return {outer, inner};
}

module.exports = splitLayoutProps;

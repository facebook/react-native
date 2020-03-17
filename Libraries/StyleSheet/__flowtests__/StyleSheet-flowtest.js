/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const StyleSheet = require('../StyleSheet');

import type {ImageStyleProp, TextStyleProp} from '../StyleSheet';
const imageStyle = {tintColor: 'rgb(0, 0, 0)'};
const textStyle = {color: 'rgb(0, 0, 0)'};

module.exports = {
  testGoodCompose() {
    (StyleSheet.compose(
      imageStyle,
      imageStyle,
    ): ImageStyleProp);

    (StyleSheet.compose(
      textStyle,
      textStyle,
    ): TextStyleProp);

    (StyleSheet.compose(
      null,
      null,
    ): TextStyleProp);

    (StyleSheet.compose(
      textStyle,
      null,
    ): TextStyleProp);

    (StyleSheet.compose(
      textStyle,
      Math.random() < 0.5 ? textStyle : null,
    ): TextStyleProp);

    (StyleSheet.compose(
      [textStyle],
      null,
    ): TextStyleProp);

    (StyleSheet.compose(
      [textStyle],
      null,
    ): TextStyleProp);

    (StyleSheet.compose(
      [textStyle],
      [textStyle],
    ): TextStyleProp);
  },

  testBadCompose() {
    // $FlowExpectedError - Incompatible type.
    (StyleSheet.compose(
      textStyle,
      textStyle,
    ): ImageStyleProp);

    // $FlowExpectedError - Incompatible type.
    (StyleSheet.compose(
      // $FlowExpectedError - Incompatible type.
      [textStyle],
      null,
    ): ImageStyleProp);

    // $FlowExpectedError - Incompatible type.
    (StyleSheet.compose(
      Math.random() < 0.5 ? textStyle : null,
      null,
    ): ImageStyleProp);
  },
};

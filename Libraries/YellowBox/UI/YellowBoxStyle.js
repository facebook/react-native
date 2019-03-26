/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const YellowBoxStyle = {
  getBackgroundColor(opacity: number): string {
    return `rgba(250, 186, 48, ${opacity})`;
  },

  getDividerColor(opacity: number): string {
    return `rgba(255, 255, 255, ${opacity})`;
  },

  getHighlightColor(opacity: number): string {
    return `rgba(252, 176, 29, ${opacity})`;
  },

  getTextColor(opacity: number): string {
    return `rgba(255, 255, 255, ${opacity})`;
  },
};

module.exports = YellowBoxStyle;

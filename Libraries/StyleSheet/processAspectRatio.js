/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const invariant = require('invariant');

function processAspectRatio(aspectRatio: number | string): ?number {
  if (typeof aspectRatio === 'number') {
    return aspectRatio;
  }

  const match = new RegExp(
    /(^\s*[+]?\d+([.]\d+)?\s*$)|(^\s*([+]?\d+([.]\d+)?)\s*\/\s*([+]?\d+([.]\d+)?)\s*$)/,
  ).exec(aspectRatio);

  if (__DEV__) {
    invariant(
      Boolean(match),
      'aspectRatio must either be a number or a ratio. You passed: %s',
      aspectRatio,
    );
  }

  if (!match) {
    return;
  }

  if (match[4] !== undefined) {
    return Number(match[4]) / Number(match[6]);
  }

  return Number(match[1]);
}

module.exports = processAspectRatio;

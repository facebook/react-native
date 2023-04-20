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

function processAspectRatio(aspectRatio?: number | string): ?number {
  if (typeof aspectRatio === 'number') {
    return aspectRatio;
  }
  if (typeof aspectRatio !== 'string') {
    if (__DEV__) {
      invariant(
        !aspectRatio,
        'aspectRatio must either be a number, a ratio string or `auto`. You passed: %s',
        aspectRatio,
      );
    }
    return;
  }

  const matches = aspectRatio.split('/').map(s => s.trim());

  if (matches.includes('auto')) {
    if (__DEV__) {
      invariant(
        matches.length,
        'aspectRatio does not support `auto <ratio>`. You passed: %s',
        aspectRatio,
      );
    }
    return;
  }

  const hasNonNumericValues = matches.some(n => Number.isNaN(Number(n)));
  if (__DEV__) {
    invariant(
      !hasNonNumericValues && (matches.length === 1 || matches.length === 2),
      'aspectRatio must either be a number, a ratio string or `auto`. You passed: %s',
      aspectRatio,
    );
  }

  if (hasNonNumericValues) {
    return;
  }

  if (matches.length === 2) {
    return Number(matches[0]) / Number(matches[1]);
  }

  return Number(matches[0]);
}

module.exports = processAspectRatio;

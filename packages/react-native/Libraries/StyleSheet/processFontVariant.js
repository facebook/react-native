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

import type {____FontVariantArray_Internal} from './StyleSheetTypes';

function processFontVariant(
  fontVariant: ____FontVariantArray_Internal | string,
): ?____FontVariantArray_Internal {
  if (Array.isArray(fontVariant)) {
    return fontVariant;
  }

  // $FlowFixMe[incompatible-type]
  const match: ?____FontVariantArray_Internal = fontVariant
    .split(' ')
    .filter(Boolean);

  return match;
}

module.exports = processFontVariant;

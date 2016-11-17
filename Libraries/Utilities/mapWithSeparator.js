/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule mapWithSeparator
 * @flow
 */
'use strict';

function mapWithSeparator<TFrom, TTo>(
  items: Array<TFrom>,
  itemRenderer: (item: TFrom, index: number, items: Array<TFrom>) => TTo,
  spacerRenderer: (index: number) => TTo,
): Array<TTo> {
  const mapped = [];
  if (items.length > 0) {
    mapped.push(itemRenderer(items[0], 0, items));
    for (let ii = 1; ii < items.length; ii++) {
      mapped.push(spacerRenderer(ii - 1), itemRenderer(items[ii], ii, items));
    }
  }
  return mapped;
}

module.exports = mapWithSeparator;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const matricesDiffer = require('../matricesDiffer');

describe('matricesDiffer', function () {
  it('diffs matrices with single element', () => {
    var x = [1];
    var y = [2];
    expect(matricesDiffer(x, y)).toBe(true);

    x = [1];
    y = [1];
    expect(matricesDiffer(x, y)).toBe(false);
  });

  it('diffs matrices with different number of elements', () => {
    var x = [1, 1, 1, 1];
    var y = [1, 1, 1, 2];
    expect(matricesDiffer(x, y)).toBe(true);
  });

  it('diffs matrices with 16 elements', () => {
    var x = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    var y = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    expect(matricesDiffer(x, y)).toBe(false);

    x = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    y = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1];
    expect(matricesDiffer(x, y)).toBe(true);

    x = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    y = [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    expect(matricesDiffer(x, y)).toBe(true);
  });
});

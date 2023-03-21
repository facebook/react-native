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

describe('truncate', () => {
  const truncate = require('../truncate');

  it('should truncate', () => {
    expect(truncate('Hello, world.', 5)).toBe('He...');
  });

  it('should not truncate', () => {
    expect(truncate('Hello, world.', 50)).toBe('Hello, world.');
  });

  it('should not truncate more than minDelta chars.', () => {
    expect(truncate('Hello, world.', 7, {minDelta: 10})).toBe('Hello, world.');
    expect(truncate('Hello, world.', 7, {minDelta: 9})).toBe('Hell...');
  });

  it('should break in the middle of words', () => {
    expect(
      truncate('Hello, world.  How are you?', 18, {breakOnWords: false}),
    ).toBe('Hello, world.  H...');
    expect(
      truncate('Hello, world.\nHow are you?', 18, {breakOnWords: false}),
    ).toBe('Hello, world.\nHo...');
  });

  it('should add another character if the truncations happens in the middle of a wide char', () => {
    expect(
      truncate('Hello, world.  āA weird character', 18, {breakOnWords: false}),
    ).toBe('Hello, world.  āA...');
  });

  it('should break at word boundaries', () => {
    expect(
      truncate('Hello, world.  How are you?', 18, {breakOnWords: true}),
    ).toBe('Hello, world....');
    expect(
      truncate('Hello, world.\nHow are you?', 18, {breakOnWords: true}),
    ).toBe('Hello, world....');
  });

  it('should uses custom elipses', () => {
    expect(truncate('Hello, world.', 9, {elipsis: '&middot'})).toBe(
      'He&middot',
    );
  });

  it("shouldn't barf with weird input", () => {
    expect(truncate('Hello, world.', 0)).toBe('Hello,...');
    expect(truncate('Hello, world.', -132)).toBe('...');
    expect(truncate('', 0)).toBe('');
    expect(truncate(null, 0)).toBe(null);
  });
});

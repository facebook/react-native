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

const processAspectRatio = require('../processAspectRatio');

describe('processAspectRatio', () => {
  it('should accept numbers', () => {
    expect(processAspectRatio(1)).toBe(1);
    expect(processAspectRatio(0)).toBe(0);
    expect(processAspectRatio(1.5)).toBe(1.5);
  });

  it('should accept string numbers', () => {
    expect(processAspectRatio('1')).toBe(1);
    expect(processAspectRatio('0')).toBe(0);
    expect(processAspectRatio('1.5')).toBe(1.5);
    expect(processAspectRatio('+1.5')).toBe(1.5);
    expect(processAspectRatio('   1')).toBe(1);
    expect(processAspectRatio('   0    ')).toBe(0);
  });

  it('should accept `auto`', () => {
    expect(processAspectRatio('auto')).toBe(undefined);
    expect(processAspectRatio(' auto')).toBe(undefined);
    expect(processAspectRatio(' auto  ')).toBe(undefined);
  });

  it('should accept ratios', () => {
    expect(processAspectRatio('+1/1')).toBe(1);
    expect(processAspectRatio('0 / 10')).toBe(0);
    expect(processAspectRatio('117/ 13')).toBe(9);
    expect(processAspectRatio('1.5 /1.2')).toBe(1.25);
    expect(processAspectRatio('1/0')).toBe(Infinity);
  });

  it('should not accept invalid formats', () => {
    expect(() => processAspectRatio('0a')).toThrowErrorMatchingSnapshot();
    expect(() => processAspectRatio('1 / 1 1')).toThrowErrorMatchingSnapshot();
    expect(() => processAspectRatio('auto 1/1')).toThrowErrorMatchingSnapshot();
  });

  it('should ignore non string falsy types', () => {
    const invalidThings = [undefined, null, false];
    invalidThings.forEach(thing => {
      expect(processAspectRatio(thing)).toBe(undefined);
    });
  });

  it('should not accept non string truthy types', () => {
    const invalidThings = [() => {}, [1, 2, 3], {}];
    invalidThings.forEach(thing => {
      expect(() => processAspectRatio(thing)).toThrowErrorMatchingSnapshot();
    });
  });
});

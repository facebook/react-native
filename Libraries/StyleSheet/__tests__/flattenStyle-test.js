/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

var flattenStyle = require('flattenStyle');

describe('flattenStyle', () => {

  it('should merge style objects', () => {
    var style1 = {width: 10};
    var style2 = {height: 20};
    var flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle.width).toBe(10);
    expect(flatStyle.height).toBe(20);
  });

  it('should override style properties', () => {
    var style1 = {backgroundColor: '#000', width: 10};
    var style2 = {backgroundColor: '#023c69', width: null};
    var flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle.backgroundColor).toBe('#023c69');
    expect(flatStyle.width).toBe(null);
  });

  it('should overwrite properties with `undefined`', () => {
    var style1 = {backgroundColor: '#000'};
    var style2 = {backgroundColor: undefined};
    var flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle.backgroundColor).toBe(undefined);
  });

  it('should not fail on falsy values', () => {
    expect(() => flattenStyle([null, false, undefined])).not.toThrow();
  });

  it('should recursively flatten arrays', () => {
    var style1 = {width: 10};
    var style2 = {height: 20};
    var style3 = {width: 30};
    var flatStyle = flattenStyle([null, [], [style1, style2], style3]);
    expect(flatStyle.width).toBe(30);
    expect(flatStyle.height).toBe(20);
  });
});

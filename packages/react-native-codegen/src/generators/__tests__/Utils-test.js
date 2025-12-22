/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {toCppString, toJavaString, toObjCString} = require('../Utils');

describe('toCppString', () => {
  it('wraps string in quotes', () => {
    expect(toCppString('ModuleName')).toBe('"ModuleName"');
  });

  it('escapes backslashes and double quotes', () => {
    expect(toCppString('path\\to\\"file"')).toBe('"path\\\\to\\\\\\"file\\""');
  });

  it('escapes control characters', () => {
    expect(toCppString('a\tb\nc')).toBe('"a\\tb\\nc"');
  });

  it('preserves Unicode characters', () => {
    expect(toCppString('café😀日本語')).toBe('"café😀日本語"');
  });

  it('escapes C++ code injection attempts', () => {
    expect(toCppString('Name"; std::cout << "test"; //')).toBe(
      '"Name\\"; std::cout << \\"test\\"; //"',
    );
  });

  it('handles empty string', () => {
    expect(toCppString('')).toBe('""');
  });
});

describe('toJavaString', () => {
  it('wraps string in quotes', () => {
    expect(toJavaString('ModuleName')).toBe('"ModuleName"');
  });

  it('escapes Java code injection attempts', () => {
    expect(
      toJavaString('Name"; } static { System.out.println("test"); } //'),
    ).toBe('"Name\\"; } static { System.out.println(\\"test\\"); } //"');
  });

  it('preserves Unicode characters', () => {
    expect(toJavaString('café😀')).toBe('"café😀"');
  });
});

describe('toObjCString', () => {
  it('wraps string in @"" quotes', () => {
    expect(toObjCString('ModuleName')).toBe('@"ModuleName"');
  });

  it('escapes Obj-C code injection attempts', () => {
    expect(toObjCString('Name"; NSLog(@"test"); //')).toBe(
      '@"Name\\"; NSLog(@\\"test\\"); //"',
    );
  });

  it('preserves Unicode characters', () => {
    expect(toObjCString('日本語')).toBe('@"日本語"');
  });

  it('handles empty string', () => {
    expect(toObjCString('')).toBe('@""');
  });
});

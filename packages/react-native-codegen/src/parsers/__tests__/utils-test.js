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
const {extractNativeModuleName} = require('../utils.js');

describe('extractnativeModuleName', () => {
  it('return filename when it ends with .js', () => {
    const filename = '/some_folder/NativeModule.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ts', () => {
    const filename = '/some_folder/NativeModule.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .tsx', () => {
    const filename = '/some_folder/NativeModule.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.js', () => {
    const filename = '/some_folder/NativeModule.android.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.ts', () => {
    const filename = '/some_folder/NativeModule.android.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .android.tsx', () => {
    const filename = '/some_folder/NativeModule.android.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.js', () => {
    const filename = '/some_folder/NativeModule.ios.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.ts', () => {
    const filename = '/some_folder/NativeModule.ios.ts';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .ios.tsx', () => {
    const filename = '/some_folder/NativeModule.ios.tsx';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
  it('return filename when it ends with .windows.js', () => {
    const filename = '/some_folder/NativeModule.windows.js';
    const nativeModuleName = extractNativeModuleName(filename);
    expect(nativeModuleName).toBe('NativeModule');
  });
});

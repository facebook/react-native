/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

const {
  extractNativeModuleName,
  createParserErrorCapturer,
} = require('../utils.js');
const {ParserError} = require('../errors');

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

describe('createParserErrorCapturer', () => {
  describe("when function doesn't throw", () => {
    it("returns result and doesn't change errors array", () => {
      const [errors, guard] = createParserErrorCapturer();
      const fn = () => 'result';

      const result = guard(fn);
      expect(result).toBe('result');
      expect(errors).toHaveLength(0);
    });
  });

  describe('when function throws a ParserError', () => {
    it('returns null and adds the error in errors array instead of throwing it', () => {
      const [errors, guard] = createParserErrorCapturer();
      const ErrorThrown = new ParserError(
        'moduleName',
        null,
        'Something went wrong :(',
      );
      const fn = () => {
        throw ErrorThrown;
      };

      const result = guard(fn);
      expect(result).toBe(null);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(ErrorThrown);
      expect(() => guard(fn)).not.toThrow();
    });
  });

  describe('when function throws another error', () => {
    it("throws the error and doesn't change errors array", () => {
      const [errors, guard] = createParserErrorCapturer();
      const errorMessage = 'Something else went wrong :(';
      const fn = () => {
        throw new Error(errorMessage);
      };

      expect(() => guard(fn)).toThrow(errorMessage);
      expect(errors).toHaveLength(0);
    });
  });
});

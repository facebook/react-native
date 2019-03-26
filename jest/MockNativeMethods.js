/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const mockNativeFunction = methodName => {
  let warned = false;
  return function() {
    if (warned) {
      return;
    }
    warned = true;
    console.warn(
      'Calling .' +
        methodName +
        '() in the test renderer environment is not supported. Instead, mock ' +
        'out your components that use findNodeHandle with replacements that ' +
        "don't rely on the native environment.",
    );
  };
};

const MockNativeMethods = {
  measure: mockNativeFunction('measure'),
  measureInWindow: mockNativeFunction('measureInWindow'),
  measureLayout: mockNativeFunction('measureLayout'),
  setNativeProps: mockNativeFunction('setNativeProps'),
  focus: mockNativeFunction('focus'),
  blur: mockNativeFunction('blur'),
};

module.exports = MockNativeMethods;

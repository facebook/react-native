/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const parseErrorStack = require('../parseErrorStack');

function getFakeError() {
  return new Error('Happy Cat');
}

describe('parseErrorStack', function() {
  it('parses error stack', function() {
    const stack = parseErrorStack(getFakeError());
    expect(stack.length).toBeGreaterThan(0);

    const firstFrame = stack[0];
    expect(firstFrame.methodName).toEqual('getFakeError');
    expect(firstFrame.file).toMatch(/parseErrorStack-test\.js$/);
  });

  it('supports framesToPop', function() {
    function getWrappedError() {
      const error = getFakeError();
      error.framesToPop = 1;
      return error;
    }

    // Make sure framesToPop == 1 causes it to ignore getFakeError
    // stack frame
    const stack = parseErrorStack(getWrappedError());
    expect(stack[0].methodName).toEqual('getWrappedError');
  });

  it('ignores bad inputs', function() {
    expect(parseErrorStack({})).toEqual([]);
    expect(parseErrorStack(null)).toEqual([]);
  });
});

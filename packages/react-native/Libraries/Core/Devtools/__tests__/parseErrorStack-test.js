/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import parseErrorStack from '../parseErrorStack';

function getFakeError() {
  return new Error('Happy Cat');
}

describe('parseErrorStack', function () {
  it('parses error stack', function () {
    const stack = parseErrorStack(getFakeError().stack);
    expect(stack.length).toBeGreaterThan(0);

    const firstFrame = stack[0];
    expect(firstFrame.methodName).toEqual('getFakeError');
    expect(firstFrame.file).toMatch(/parseErrorStack-test\.js$/);
  });

  it('does not support framesToPop', function () {
    function getWrappedError() {
      const error = getFakeError();
      // $FlowFixMe[prop-missing]
      error.framesToPop = 1;
      return error;
    }

    const stack = parseErrorStack(getWrappedError().stack);
    expect(stack[0].methodName).toEqual('getFakeError');
  });

  it('ignores bad inputs', function () {
    expect(parseErrorStack(undefined)).toEqual([]);
    // $FlowExpectedError[incompatible-call]
    expect(parseErrorStack(null)).toEqual([]);
  });
});

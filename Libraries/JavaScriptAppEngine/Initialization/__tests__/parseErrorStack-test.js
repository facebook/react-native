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

var parseErrorStack = require('parseErrorStack');

function getFakeError() {
  return new Error('Happy Cat');
}

describe('parseErrorStack', function() {

  it('parses error stack', function() {
    var stack = parseErrorStack(getFakeError());
    expect(stack.length).toBeGreaterThan(0);

    var firstFrame = stack[0];
    expect(firstFrame.methodName).toEqual('getFakeError');
    expect(firstFrame.file).toMatch(/parseErrorStack-test\.js$/);
  });

  it('supports framesToPop', function() {
    function getWrappedError() {
      var error = getFakeError();
      error.framesToPop = 1;
      return error;
    }

    // Make sure framesToPop == 1 causes it to ignore getFakeError
    // stack frame
    var stack = parseErrorStack(getWrappedError());
    expect(stack[0].methodName).toEqual('getWrappedError');
  });

  it('ignores bad inputs', function() {
    expect(parseErrorStack({})).toEqual([]);
    expect(parseErrorStack(null)).toEqual([]);
  });

});

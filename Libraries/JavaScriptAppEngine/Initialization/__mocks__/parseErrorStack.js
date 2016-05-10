/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const parseErrorStack = jest.genMockFunction();

const frame = [{
  file: '/Examples/UIExplorer/ViewExample.js',
  methodName: 'Constructor.render',
  lineNumber: 42,
  column: 0
}];

parseErrorStack.mockReturnValue(frame);

module.exports = parseErrorStack;

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// This mock only provides short-circuited methods of applyWithGuard and guard.
// A lot of modules rely on these two functions. This mock relieves their tests
// from depending on the real ErrorUtils module. If you need real error handling
// don't use this mock.
'use strict';

function execute(fun, context, args) {
  return fun.apply(context, args);
}

function reportError(error) {
  throw error;
}

var ErrorUtils = {
  apply: jest.fn(execute),
  applyWithGuard: jest.fn(execute),
  guard: jest.fn(callback => callback),
  inGuard: jest.fn().mockReturnValue(true),
  reportError: jest.fn(reportError),
  setGlobalHandler: jest.fn(),
};

module.exports = ErrorUtils;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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

const ErrorUtils = {
  apply: jest.fn(execute),
  applyWithGuard: jest.fn(execute),
  guard: jest.fn(callback => callback),
  inGuard: jest.fn().mockReturnValue(true),
  reportError: jest.fn(reportError),
  setGlobalHandler: jest.fn(),
};

module.exports = ErrorUtils;

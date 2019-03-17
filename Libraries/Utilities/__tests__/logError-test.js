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

describe('logError', () => {
  const logError = require('logError');

  it('logs messages to the console', () => {
    console.log = jest.fn();

    logError('This is a log message');

    expect(console.log).toHaveBeenCalledWith('This is a log message');
  });
});

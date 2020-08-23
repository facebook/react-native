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

describe('infoLog', () => {
  const infoLog = require('../infoLog');

  it('logs messages to the console', () => {
    console.log = jest.fn();

    infoLog('This is a log message');

    expect(console.log).toHaveBeenCalledWith('This is a log message');
  });

  it('logs messages with multiple arguments to the console', () => {
    console.log = jest.fn();

    const data = 'log';
    infoLog('This is a', data, 'message');

    expect(console.log).toHaveBeenCalledWith('This is a', 'log', 'message');
  });
});

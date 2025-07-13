/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import logError from '../logError';

describe('logError', () => {
  it('logs error messages to the console', () => {
    console.error.apply = jest.fn();

    logError('This is a log message');

    expect(console.error.apply).toHaveBeenCalledWith(console, [
      'This is a log message',
    ]);
  });

  it('logs error messages with multiple arguments to the console', () => {
    console.error.apply = jest.fn();

    const data = 'log';
    logError('This is a', data, 'message');

    expect(console.error.apply).toHaveBeenCalledWith(console, [
      'This is a',
      'log',
      'message',
    ]);
  });

  it('logs errors to the console', () => {
    // $FlowFixMe[cannot-write]
    console.error = jest.fn();

    logError(new Error('The error message'));

    // $FlowFixMe[prop-missing]
    expect(console.error.mock.calls[0][0]).toContain(
      'Error: "The error message".  Stack:',
    );
  });
});

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

describe('warnOnce', () => {
  const warnOnce = require('../warnOnce');

  it('logs warning messages to the console exactly once', () => {
    console.error = jest.fn();

    warnOnce('test-message', 'This is a log message');
    warnOnce('test-message', 'This is a second log message');

    expect(console.error).toHaveBeenCalledWith(
      'Warning: This is a log message',
    );
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

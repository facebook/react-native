/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import warnOnce from '../warnOnce';

describe('warnOnce', () => {
  it('logs warning messages to the console exactly once', () => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'warn').mockReturnValue(undefined);

    warnOnce('test-message', 'This is a log message');
    warnOnce('test-message', 'This is a second log message');

    expect(console.warn).toHaveBeenCalledWith('This is a log message');
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

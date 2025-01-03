/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '../../../../Libraries/Core/InitializeCore.js';

describe('globalEventTarget', () => {
  it('should be an instance of EventTarget', () => {
    expect(globalThis).toBeInstanceOf(EventTarget);
  });

  it('should work as an event target', () => {
    const listener = jest.fn();

    window.addEventListener('global-event', listener);

    const globalEvent = new Event('global-event');

    window.dispatchEvent(globalEvent);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.lastCall[0]).toBe(globalEvent);

    window.removeEventListener('global-event', listener);

    window.dispatchEvent(globalEvent);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

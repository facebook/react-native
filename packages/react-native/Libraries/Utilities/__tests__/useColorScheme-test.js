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

import useColorScheme from '../useColorScheme';

describe('useColorScheme', () => {
  it('should return a mocked light theme by default', () => {
    expect(jest.isMockFunction(useColorScheme)).toBe(true);
    expect(useColorScheme()).toBe('light');
  });

  it('should have console.error when not using mock', () => {
    const useColorSchemeActual = jest.requireActual<{
      default: typeof useColorScheme,
    }>('../useColorScheme').default;
    const spy = jest.spyOn(console, 'error').mockImplementationOnce(() => {
      // Simulate LogBox console.error() call to throw an error and stop the further execution
      throw new Error('console.error() was called');
    });

    expect(() => {
      useColorSchemeActual();
    }).toThrow();

    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(
        /Invalid hook call. Hooks can only be called inside of the body of a function component./,
      ),
    );
  });
});

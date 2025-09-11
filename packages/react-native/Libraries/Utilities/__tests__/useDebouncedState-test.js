/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useDebouncedState } from '../DebouncedState/useDebouncedState';

jest.useFakeTimers();

describe('useDebouncedState', () => {
  it('should debounce state updates', () => {
    const { result } = renderHook(() => useDebouncedState(0, 100));

    act(() => {
      result.current[1](1);
      result.current[1](2);
      result.current[1](3);
    });

    expect(result.current[0]).toBe(0); // No immediate change

    jest.advanceTimersByTime(50);
    expect(result.current[0]).toBe(0); // Still debouncing

    jest.advanceTimersByTime(50);
    expect(result.current[0]).toBe(3); // Final update
  });

  it('supports updater function', () => {
    const { result } = renderHook(() => useDebouncedState(0, 100));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    jest.advanceTimersByTime(100);
    expect(result.current[0]).toBe(1);
  });
});
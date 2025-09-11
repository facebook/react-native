/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
import { useState, useCallback } from 'react';

function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * A hook that provides a debounced state setter to prevent rapid updates.
 * @param initialValue Initial state value or lazy initializer.
 * @param delay Debounce delay in ms (default: 300).
 * @returns [value, setValue] tuple.
 */
export function useDebouncedState(initialValue, delay = 300) {
  const [value, setValue] = useState(initialValue);

  const debouncedSet = useCallback(
    debounce(setValue, delay),
    [delay]
  );

  return [value, debouncedSet];
}
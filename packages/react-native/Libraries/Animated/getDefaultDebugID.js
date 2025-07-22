/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

export default function getDefaultDebugID(): string | void {
  if (__DEV__) {
    // List of function names to skip (React/React Native internals)
    const skipList = [
      'getDefaultDebugID',
      'AnimatedInterpolation',
      'interpolate',
      'AnimatedValue',
      'apply',
      '_callSuper',
      'AnimatedEventValues',
      'anonymous',
      'mountMemo',
      'useMemo',
      'AnimatedColor',
      'useAnimatedValue',
      'useAnimatedValuePolyfill',
      // Common React hooks and functions
      'useState',
      'useEffect',
      'useCallback',
      'useRef',
      'useReducer',
      'useContext',
      'useLayoutEffect',
      'render',
      'forwardRef',
      'memo',
      'updateMemo',
    ];

    const stackTrace = new Error().stack;

    // Split the stack trace into lines
    const lines = stackTrace.split('\n');

    // Process each line
    for (const line of lines) {
      // Check if this is a stack frame line (starts with "at ")
      if (line.includes('at ')) {
        // Extract the function name (between "at " and opening parenthesis or end of line)
        // This regex captures function names that may include dots (e.g., Component.render)
        const match = line.match(/at\s+([^\s(]+(?:\.[^\s(]+)*)/);

        if (match && match[1]) {
          const functionName = match[1];

          // If the function name is not in the skip list, return it
          if (!skipList.includes(functionName)) {
            return functionName;
          }
        }
      }
    }

    // No valid component name found
  }
  return undefined;
}

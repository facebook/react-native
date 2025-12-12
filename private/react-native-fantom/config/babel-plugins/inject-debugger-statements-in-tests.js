/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

/**
 * This transform injects a single `debugger;` statement at the top of every
 * Fantom test, so we can automatically stop on them when debugging.
 */
module.exports = function ({types: t}) {
  return {
    name: 'inject-debugger-statements-in-tests',
    visitor: {
      Program(path, state) {
        const filename = state.filename || '';
        if (
          (filename.endsWith('-itest.js') ||
            filename.endsWith('-itest.fb.js')) &&
          !filename.includes('/.out/')
        ) {
          // Check if the first statement is already a debugger statement
          const first = path.node.body[0];
          if (!first || first.type !== 'DebuggerStatement') {
            path.unshiftContainer('body', t.debuggerStatement());
          }
        }
      },
    },
  };
};

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

'use strict';

import type {StackFrame} from '../../../Core/NativeExceptionsManager';

const {
  parseLogBoxException,
  parseLogBoxLog,
  withoutANSIColorStyles,
} = require('../parseLogBoxLog');

describe('parseLogBoxLog', () => {
  it('parses strings', () => {
    expect(parseLogBoxLog(['A'])).toEqual({
      componentStackType: 'legacy',
      componentStack: [],
      category: 'A',
      message: {
        content: 'A',
        substitutions: [],
      },
    });
  });

  it('parses strings with arguments', () => {
    expect(parseLogBoxLog(['A', 'B', 'C'])).toEqual({
      componentStackType: 'legacy',
      componentStack: [],
      category: 'A B C',
      message: {
        content: 'A B C',
        substitutions: [],
      },
    });
  });

  it('parses formatted strings', () => {
    expect(parseLogBoxLog(['%s', 'A'])).toEqual({
      componentStackType: 'legacy',
      componentStack: [],
      category: '\ufeff%s',
      message: {
        content: 'A',
        substitutions: [
          {
            length: 1,
            offset: 0,
          },
        ],
      },
    });
  });

  it('parses formatted strings with insufficient arguments', () => {
    expect(parseLogBoxLog(['%s %s', 'A'])).toEqual({
      componentStackType: 'legacy',
      componentStack: [],
      category: '\ufeff%s %s',
      message: {
        content: 'A %s',
        substitutions: [
          {
            length: 1,
            offset: 0,
          },
          {
            length: 2,
            offset: 2,
          },
        ],
      },
    });
  });

  it('parses formatted strings with excess arguments', () => {
    expect(parseLogBoxLog(['%s', 'A', 'B'])).toEqual({
      componentStackType: 'legacy',
      componentStack: [],
      category: '\ufeff%s B',
      message: {
        content: 'A B',
        substitutions: [
          {
            length: 1,
            offset: 0,
          },
        ],
      },
    });
  });

  it('treats "%s" in arguments as literals', () => {
    expect(parseLogBoxLog(['%s', '%s', 'A'])).toEqual({
      componentStackType: 'legacy',
      componentStack: [],
      category: '\ufeff%s A',
      message: {
        content: '%s A',
        substitutions: [
          {
            length: 2,
            offset: 0,
          },
        ],
      },
    });
  });

  it('does not duplicate message if component stack found but not parsed', () => {
    expect(
      parseLogBoxLog([
        'Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.%s',
        '\n\nCheck the render method of `MyOtherComponent`.',
        '',
        '\n    in\n    in\n    in',
      ]),
    ).toEqual({
      componentStackType: 'legacy',
      componentStack: [],
      category:
        'Each child in a list should have a unique "key" prop.﻿%s﻿%s See https://fb.me/react-warning-keys for more information.',
      message: {
        content:
          'Each child in a list should have a unique "key" prop.\n\nCheck the render method of `MyOtherComponent`. See https://fb.me/react-warning-keys for more information.',
        substitutions: [
          {
            length: 48,
            offset: 53,
          },
          {
            length: 0,
            offset: 101,
          },
        ],
      },
    });
  });

  it('detects a component stack in an interpolated warning', () => {
    expect(
      parseLogBoxLog([
        'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s%s',
        '\n\nCheck the render method of `Container(Component)`.',
        '\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
      ]),
    ).toEqual({
      componentStackType: 'legacy',
      componentStack: [
        {
          content: 'MyComponent',
          fileName: 'filename.js',
          location: {column: -1, row: 1},
        },
        {
          content: 'MyOtherComponent',
          fileName: 'filename2.js',
          location: {column: -1, row: 1},
        },
      ],
      category:
        'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?﻿%s',
      message: {
        content:
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?\n\nCheck the render method of `Container(Component)`.',
        substitutions: [
          {
            length: 52,
            offset: 120,
          },
        ],
      },
    });
  });

  it('detects a component stack in the first argument', () => {
    expect(
      parseLogBoxLog([
        'Some kind of message\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
      ]),
    ).toEqual({
      componentStackType: 'legacy',
      componentStack: [
        {
          content: 'MyComponent',
          fileName: 'filename.js',
          location: {column: -1, row: 1},
        },
        {
          content: 'MyOtherComponent',
          fileName: 'filename2.js',
          location: {column: -1, row: 1},
        },
      ],
      category: 'Some kind of message',
      message: {
        content: 'Some kind of message',
        substitutions: [],
      },
    });
  });

  it('detects a component stack in the second argument', () => {
    expect(
      parseLogBoxLog([
        'Some kind of message',
        '\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
      ]),
    ).toEqual({
      componentStackType: 'legacy',
      componentStack: [
        {
          content: 'MyComponent',
          fileName: 'filename.js',
          location: {column: -1, row: 1},
        },
        {
          content: 'MyOtherComponent',
          fileName: 'filename2.js',
          location: {column: -1, row: 1},
        },
      ],
      category: 'Some kind of message',
      message: {
        content: 'Some kind of message',
        substitutions: [],
      },
    });
  });

  it('detects a component stack in the nth argument', () => {
    expect(
      parseLogBoxLog([
        'Some kind of message',
        'Some other kind of message',
        '\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
        'Some third kind of message',
      ]),
    ).toEqual({
      componentStackType: 'legacy',
      componentStack: [
        {
          content: 'MyComponent',
          fileName: 'filename.js',
          location: {column: -1, row: 1},
        },
        {
          content: 'MyOtherComponent',
          fileName: 'filename2.js',
          location: {column: -1, row: 1},
        },
      ],
      category:
        'Some kind of message Some other kind of message Some third kind of message',
      message: {
        content:
          'Some kind of message Some other kind of message Some third kind of message',
        substitutions: [],
      },
    });
  });

  it('parses a transform error as a fatal', () => {
    const error = {
      message: 'TransformError failed to transform file.',
      originalMessage: 'TransformError failed to transform file.',
      name: '',
      isComponentError: false,
      componentStackType: 'legacy',
      componentStack: '',
      stack: ([]: Array<StackFrame>),
      id: 0,
      isFatal: true,
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'syntax',
      isComponentError: false,
      message: {
        content: 'TransformError failed to transform file.',
        substitutions: [],
      },
      stack: [],
      componentStackType: 'legacy',
      componentStack: [],
      category: 'TransformError failed to transform file.',
    });
  });

  it('parses a babel transform syntax error', () => {
    const error = {
      message: `

  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      originalMessage: `TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)

  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      name: '',
      isComponentError: false,
      componentStackType: 'legacy',
      componentStack: '',
      stack: ([]: Array<StackFrame>),
      id: 0,
      isFatal: true,
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'syntax',
      isComponentError: false,
      codeFrame: {
        fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
        location: {row: 199, column: 0},
        content: `  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      },
      message: {
        content: "'import' and 'export' may only appear at the top level",
        substitutions: [],
      },
      stack: [],
      componentStackType: 'legacy',
      componentStack: [],
      category: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js-199-0',
    });
  });

  it('parses an invalid require syntax error', () => {
    const error = {
      message: `Unable to resolve module \`ListCellx\` from /path/to/file.js: ListCellx could not be found within the project.

If you are sure the module exists, try these steps:
 1. Clear watchman watches: watchman watch-del-all
 2. Delete node_modules and run yarn install
 3. Reset Metro's cache: yarn start --reset-cache
 4. Remove the cache: rm -rf /tmp/metro-*
\u001b[0m \u001b[90m 10 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mColor\u001b[39m from \u001b[32m'Color'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 11 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mList\u001b[39m from \u001b[32m'List'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 12 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mListCell\u001b[39m from \u001b[32m'ListCellx'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m    | \u001b[39m                           \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 13 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mNullState\u001b[39m from \u001b[32m'NullState'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 14 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mUnitHeader\u001b[39m from \u001b[32m'UnitHeader'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 15 | \u001b[39m\u001b[36mimport\u001b[39m fbRemoteAsset from \u001b[32m'fbRemoteAsset'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m`,
      originalMessage: `Unable to resolve module \`ListCellx\` from /path/to/file.js: ListCellx could not be found within the project.

If you are sure the module exists, try these steps:
 1. Clear watchman watches: watchman watch-del-all
 2. Delete node_modules and run yarn install
 3. Reset Metro's cache: yarn start --reset-cache
 4. Remove the cache: rm -rf /tmp/metro-*
\u001b[0m \u001b[90m 10 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mColor\u001b[39m from \u001b[32m'Color'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 11 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mList\u001b[39m from \u001b[32m'List'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 12 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mListCell\u001b[39m from \u001b[32m'ListCellx'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m    | \u001b[39m                           \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 13 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mNullState\u001b[39m from \u001b[32m'NullState'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 14 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mUnitHeader\u001b[39m from \u001b[32m'UnitHeader'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 15 | \u001b[39m\u001b[36mimport\u001b[39m fbRemoteAsset from \u001b[32m'fbRemoteAsset'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m`,
      name: '',
      isComponentError: false,
      componentStackType: 'legacy',
      componentStack: '',
      stack: ([]: Array<StackFrame>),
      id: 0,
      isFatal: true,
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'syntax',
      isComponentError: false,
      codeFrame: {
        fileName: '/path/to/file.js',
        location: null,
        content: `\u001b[0m \u001b[90m 10 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mColor\u001b[39m from \u001b[32m'Color'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 11 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mList\u001b[39m from \u001b[32m'List'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 12 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mListCell\u001b[39m from \u001b[32m'ListCellx'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m    | \u001b[39m                           \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 13 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mNullState\u001b[39m from \u001b[32m'NullState'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 14 | \u001b[39m\u001b[36mimport\u001b[39m \u001b[33mUnitHeader\u001b[39m from \u001b[32m'UnitHeader'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m
\u001b[0m \u001b[90m 15 | \u001b[39m\u001b[36mimport\u001b[39m fbRemoteAsset from \u001b[32m'fbRemoteAsset'\u001b[39m\u001b[33m;\u001b[39m\u001b[0m`,
      },
      message: {
        content: `ListCellx could not be found within the project.

If you are sure the module exists, try these steps:
 1. Clear watchman watches: watchman watch-del-all
 2. Delete node_modules and run yarn install
 3. Reset Metro's cache: yarn start --reset-cache
 4. Remove the cache: rm -rf /tmp/metro-*`,
        substitutions: [],
      },
      stack: [],
      componentStackType: 'legacy',
      componentStack: [],
      category: '/path/to/file.js-1-1',
    });
  });

  it('parses a reference error', () => {
    const error = {
      message: `

  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      originalMessage: `TransformError ReferenceError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)

  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      name: '',
      isComponentError: false,
      componentStackType: 'legacy',
      componentStack: '',
      stack: ([]: Array<StackFrame>),
      id: 0,
      isFatal: true,
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'syntax',
      isComponentError: false,
      codeFrame: {
        fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
        location: {row: 199, column: 0},
        content: `  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      },
      message: {
        content: "'import' and 'export' may only appear at the top level",
        substitutions: [],
      },
      stack: [],
      componentStackType: 'legacy',
      componentStack: [],
      category: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js-199-0',
    });
  });

  it('parses a babel codeframe error', () => {
    const error = {
      message: `TransformError RKJSModules/Apps/CrashReact/CrashReactApp.js: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: The first argument to \`fbRemoteAsset\` is "null_state_glyphs", but the requested asset is missing from the local metadata. Either the asset does not exist or the metadata is not up-to-date.

Please follow the instructions at: fburl.com/rn-remote-assets
  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      originalMessage: `TransformError RKJSModules/Apps/CrashReact/CrashReactApp.js: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: The first argument to \`fbRemoteAsset\` is "null_state_glyphs", but the requested asset is missing from the local metadata. Either the asset does not exist or the metadata is not up-to-date.

Please follow the instructions at: fburl.com/rn-remote-assets
  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      name: '',
      isComponentError: false,
      componentStackType: 'legacy',
      componentStack: '',
      stack: ([]: Array<StackFrame>),
      id: 0,
      isFatal: true,
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'syntax',
      isComponentError: false,
      codeFrame: {
        fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
        location: null,
        content: `  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      },
      message: {
        content: `The first argument to \`fbRemoteAsset\` is "null_state_glyphs", but the requested asset is missing from the local metadata. Either the asset does not exist or the metadata is not up-to-date.

Please follow the instructions at: fburl.com/rn-remote-assets`,
        substitutions: [],
      },
      stack: [],
      componentStackType: 'legacy',
      componentStack: [],
      category: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js-1-1',
    });
  });

  it('parses a babel codeframe error with ansi', () => {
    const error = {
      message: `TransformError RKJSModules/Apps/CrashReact/CrashReactApp.js: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: The first argument to \`fbRemoteAsset\` is "null_state_glyphs", but the requested asset is missing from the local metadata. Either the asset does not exist or the metadata is not up-to-date.

Please follow the instructions at: fburl.com/rn-remote-assets
  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
      originalMessage: `TransformError RKJSModules/Apps/CrashReact/CrashReactApp.js: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: The first argument to \`fbRemoteAsset\` is "null_state_glyphs", but the requested asset is missing from the local metadata. Either the asset does not exist or the metadata is not up-to-date.

Please follow the instructions at: fburl.com/rn-remote-assets
\u001b[0m \u001b[90m 46 | \u001b[39m            headline\u001b[33m=\u001b[39m\u001b[32m"CrashReact Error Boundary"\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 47 | \u001b[39m            body\u001b[33m=\u001b[39m{\u001b[32m\`\${this.state.errorMessage}\`\u001b[39m}\u001b[0m\n\u001b[0m\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 48 | \u001b[39m            icon\u001b[33m=\u001b[39m{fbRemoteAsset(\u001b[32m'null_state_glyphs'\u001b[39m\u001b[33m,\u001b[39m {\u001b[0m\n\u001b[0m \u001b[90m    | \u001b[39m                                                     \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 49 | \u001b[39m              name\u001b[33m:\u001b[39m \u001b[32m'codexxx'\u001b[39m\u001b[33m,\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 50 | \u001b[39m              size\u001b[33m:\u001b[39m \u001b[32m'112'\u001b[39m\u001b[33m,\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 51 | \u001b[39m            })}\u001b[0m`,
      name: '',
      isComponentError: false,
      componentStackType: 'legacy',
      componentStack: '',
      stack: ([]: Array<StackFrame>),
      id: 0,
      isFatal: true,
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'syntax',
      isComponentError: false,
      codeFrame: {
        fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
        location: null,
        content:
          "\u001b[0m \u001b[90m 46 | \u001b[39m            headline\u001b[33m=\u001b[39m\u001b[32m\"CrashReact Error Boundary\"\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 47 | \u001b[39m            body\u001b[33m=\u001b[39m{\u001b[32m`${this.state.errorMessage}`\u001b[39m}\u001b[0m\n\u001b[0m\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 48 | \u001b[39m            icon\u001b[33m=\u001b[39m{fbRemoteAsset(\u001b[32m'null_state_glyphs'\u001b[39m\u001b[33m,\u001b[39m {\u001b[0m\n\u001b[0m \u001b[90m    | \u001b[39m                                                     \u001b[31m\u001b[1m^\u001b[22m\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 49 | \u001b[39m              name\u001b[33m:\u001b[39m \u001b[32m'codexxx'\u001b[39m\u001b[33m,\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 50 | \u001b[39m              size\u001b[33m:\u001b[39m \u001b[32m'112'\u001b[39m\u001b[33m,\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 51 | \u001b[39m            })}\u001b[0m",
      },
      message: {
        content: `The first argument to \`fbRemoteAsset\` is "null_state_glyphs", but the requested asset is missing from the local metadata. Either the asset does not exist or the metadata is not up-to-date.

Please follow the instructions at: fburl.com/rn-remote-assets`,
        substitutions: [],
      },
      stack: [],
      componentStackType: 'legacy',
      componentStack: [],
      category: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js-1-1',
    });
  });

  it('parses an error log with `error.componentStack`', () => {
    const error = {
      id: 0,
      isFatal: false,
      isComponentError: false,
      message: '### Error',
      originalMessage: '### Error',
      name: '',
      componentStackType: 'legacy',
      componentStack:
        '\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'error',
      category: '### Error',
      isComponentError: false,
      message: {
        content: '### Error',
        substitutions: [],
      },
      componentStackType: 'legacy',
      componentStack: [
        {
          content: 'MyComponent',
          fileName: 'filename.js',
          location: {column: -1, row: 1},
        },
        {
          content: 'MyOtherComponent',
          fileName: 'filename2.js',
          location: {column: -1, row: 1},
        },
      ],
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    });
  });

  it('parses an error log with a component stack in the message', () => {
    const error = {
      id: 0,
      isFatal: false,
      isComponentError: false,
      message:
        'Some kind of message\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
      originalMessage:
        'Some kind of message\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
      name: '',
      componentStackType: 'legacy',
      componentStack: null,
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    };
    expect(parseLogBoxException(error)).toEqual({
      level: 'error',
      isComponentError: false,
      stack: [
        {
          collapse: false,
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
        },
      ],
      componentStackType: 'legacy',
      componentStack: [
        {
          content: 'MyComponent',
          fileName: 'filename.js',
          location: {column: -1, row: 1},
        },
        {
          content: 'MyOtherComponent',
          fileName: 'filename2.js',
          location: {column: -1, row: 1},
        },
      ],
      category: 'Some kind of message',
      message: {
        content: 'Some kind of message',
        substitutions: [],
      },
    });
  });

  it('parses a fatal exception', () => {
    const error = {
      id: 0,
      isFatal: true,
      isComponentError: false,
      message: '### Fatal',
      originalMessage: '### Fatal',
      componentStackType: 'legacy',
      componentStack: null,
      name: '',
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'fatal',
      category: '### Fatal',
      isComponentError: false,
      message: {
        content: '### Fatal',
        substitutions: [],
      },
      componentStackType: 'legacy',
      componentStack: [],
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    });
  });

  it('parses a render error', () => {
    const error = {
      id: 0,
      isComponentError: true,
      isFatal: true,
      message: '### Fatal',
      originalMessage: '### Fatal',
      componentStack: null,
      name: '',
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'fatal',
      category: '### Fatal',
      isComponentError: true,
      message: {
        content: '### Fatal',
        substitutions: [],
      },
      componentStackType: 'legacy',
      componentStack: [],
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    });
  });

  it('a malformed syntax error falls back to a syntax error', () => {
    const error = {
      id: 0,
      isFatal: true,
      isComponentError: false,
      // Note no code frame.
      message:
        "TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)",
      originalMessage:
        "TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)",
      componentStack: null,
      name: '',
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'syntax',
      category:
        "TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)",
      message: {
        content:
          "TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)",
        substitutions: [],
      },
      isComponentError: false,
      componentStackType: 'legacy',
      componentStack: [],
      stack: [
        {
          column: 1,
          file: 'foo.js',
          lineNumber: 1,
          methodName: 'bar',
          collapse: false,
        },
      ],
    });
  });

  describe('Handles component stack frames without debug source', () => {
    it('detects a component stack in an interpolated warning', () => {
      expect(
        parseLogBoxLog([
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s%s',
          '\n\nCheck the render method of `MyComponent`.',
          '\n    in MyComponent (created by MyOtherComponent)\n    in MyOtherComponent (created by MyComponent)\n    in MyAppComponent (created by MyOtherComponent)',
        ]),
      ).toEqual({
        componentStackType: 'legacy',
        componentStack: [
          {
            content: 'MyComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyOtherComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyAppComponent',
            fileName: '',
            location: null,
          },
        ],
        category:
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?﻿%s',
        message: {
          content:
            'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?\n\nCheck the render method of `MyComponent`.',
          substitutions: [
            {
              length: 43,
              offset: 120,
            },
          ],
        },
      });
    });

    it('detects a component stack in the first argument', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message\n    in MyComponent (created by MyOtherComponent)\n    in MyOtherComponent (created by MyComponent)\n    in MyAppComponent (created by MyOtherComponent)',
        ]),
      ).toEqual({
        componentStackType: 'legacy',
        componentStack: [
          {
            content: 'MyComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyOtherComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyAppComponent',
            fileName: '',
            location: null,
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the second argument', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message',
          '\n    in MyComponent (created by MyOtherComponent)\n    in MyOtherComponent (created by MyComponent)\n    in MyAppComponent (created by MyOtherComponent)',
        ]),
      ).toEqual({
        componentStackType: 'legacy',
        componentStack: [
          {
            content: 'MyComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyOtherComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyAppComponent',
            fileName: '',
            location: null,
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the nth argument', () => {
      expect(
        parseLogBoxLog([
          'Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.%s',
          '\n\nCheck the render method of `MyOtherComponent`.',
          '',
          '\n    in MyComponent (created by MyOtherComponent)\n    in MyOtherComponent (created by MyComponent)\n    in MyAppComponent (created by MyOtherComponent)',
        ]),
      ).toEqual({
        componentStackType: 'legacy',
        componentStack: [
          {
            content: 'MyComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyOtherComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyAppComponent',
            fileName: '',
            location: null,
          },
        ],
        category:
          'Each child in a list should have a unique "key" prop.﻿%s﻿%s See https://fb.me/react-warning-keys for more information.',
        message: {
          content:
            'Each child in a list should have a unique "key" prop.\n\nCheck the render method of `MyOtherComponent`. See https://fb.me/react-warning-keys for more information.',
          substitutions: [
            {
              length: 48,
              offset: 53,
            },
            {
              length: 0,
              offset: 101,
            },
          ],
        },
      });
    });

    it('detects a single component in a component stack', () => {
      const error = {
        id: 0,
        isFatal: true,
        isComponentError: true,
        message:
          'Error: Some kind of message\n\nThis error is located at:\n    in MyComponent (created by MyOtherComponent)\n',
        originalMessage: 'Some kind of message',
        name: '',
        componentStackType: 'legacy',
        componentStack: '\n    in MyComponent (created by MyOtherComponent)\n',
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      };

      expect(parseLogBoxException(error)).toEqual({
        level: 'fatal',
        isComponentError: true,
        stack: [
          {
            collapse: false,
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
          },
        ],
        componentStackType: 'legacy',
        componentStack: [
          {
            content: 'MyComponent',
            fileName: '',
            location: null,
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('parses an error log with `error.componentStack`', () => {
      const error = {
        id: 0,
        isFatal: false,
        isComponentError: false,
        message: '### Error',
        originalMessage: '### Error',
        name: '',
        componentStack:
          '\n    in MyComponent (created by MyOtherComponent)\n    in MyOtherComponent (created by MyComponent)\n    in MyAppComponent (created by MyOtherComponent)',
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      };

      expect(parseLogBoxException(error)).toEqual({
        level: 'error',
        category: '### Error',
        isComponentError: false,
        message: {
          content: '### Error',
          substitutions: [],
        },
        componentStackType: 'legacy',
        componentStack: [
          {
            content: 'MyComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyOtherComponent',
            fileName: '',
            location: null,
          },
          {
            content: 'MyAppComponent',
            fileName: '',
            location: null,
          },
        ],
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      });
    });
  });

  describe('Handles component stack frames formatted as call stacks in Hermes', () => {
    let originalHermesInternal;
    beforeEach(() => {
      originalHermesInternal = global.HermesInternal;
      // $FlowFixMe[cannot-write] - Jest
      global.HermesInternal = true;
    });
    afterEach(() => {
      // $FlowFixMe[cannot-write] - Jest
      global.HermesInternal = originalHermesInternal;
    });

    // In new versions of React, the component stack frame format changed to match call stacks.
    it('detects a component stack in an interpolated warning', () => {
      expect(
        parseLogBoxLog([
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s%s',
          '\n\nCheck the render method of `MyComponent`.',
          '\n    at MyComponent (/path/to/filename.js:1:2)\n    at MyOtherComponent\n    at MyAppComponent (/path/to/app.js:100:20)',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          // TODO: we're missing the second component,
          // because React isn't sending back a properly formatted stackframe.
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category:
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?﻿%s',
        message: {
          content:
            'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?\n\nCheck the render method of `MyComponent`.',
          substitutions: [
            {
              length: 43,
              offset: 120,
            },
          ],
        },
      });
    });

    it('detects a component stack in the first argument', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message\n    at MyComponent (/path/to/filename.js:1:2)\n    at MyOtherComponent\n    at MyAppComponent (/path/to/app.js:100:20)',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          // TODO: we're missing the second component,
          // because React isn't sending back a properly formatted stackframe.
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the second argument', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message',
          '\n    at MyComponent (/path/to/filename.js:1:2)\n    at MyOtherComponent\n    at MyAppComponent (/path/to/app.js:100:20)',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          // TODO: we're missing the second component,
          // because React isn't sending back a properly formatted stackframe.
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the nth argument', () => {
      expect(
        parseLogBoxLog([
          'Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.%s',
          '\n\nCheck the render method of `MyOtherComponent`.',
          '',
          '\n    at MyComponent (/path/to/filename.js:1:2)\n    at MyOtherComponent\n    at MyAppComponent (/path/to/app.js:100:20)',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          // TODO: we're missing the second component,
          // because React isn't sending back a properly formatted stackframe.
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category:
          'Each child in a list should have a unique "key" prop.﻿%s﻿%s See https://fb.me/react-warning-keys for more information.',
        message: {
          content:
            'Each child in a list should have a unique "key" prop.\n\nCheck the render method of `MyOtherComponent`. See https://fb.me/react-warning-keys for more information.',
          substitutions: [
            {
              length: 48,
              offset: 53,
            },
            {
              length: 0,
              offset: 101,
            },
          ],
        },
      });
    });

    it('parses an error log with `error.componentStack`', () => {
      const error = {
        id: 0,
        isFatal: false,
        isComponentError: false,
        message: '### Error',
        originalMessage: '### Error',
        name: '',
        componentStack:
          '\n    at MyComponent (/path/to/filename.js:1:2)\n    at MyOtherComponent\n    at MyAppComponent (/path/to/app.js:100:20)',
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      };

      expect(parseLogBoxException(error)).toEqual({
        level: 'error',
        category: '### Error',
        isComponentError: false,
        message: {
          content: '### Error',
          substitutions: [],
        },
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          // TODO: we're missing the second component,
          // because React isn't sending back a properly formatted stackframe.
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      });
    });
  });

  describe('Handles component stack frames formatted as call stacks in JSC', () => {
    // In new versions of React, the component stack frame format changed to match call stacks.
    it('detects a component stack in an interpolated warning', () => {
      expect(
        parseLogBoxLog([
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s%s',
          '\n\nCheck the render method of `MyComponent`.',
          '\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          {
            collapse: false,
            content: 'forEach',
            fileName: '[native code]',
            location: {column: -1, row: -1},
          },
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category:
          'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?﻿%s',
        message: {
          content:
            'Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?\n\nCheck the render method of `MyComponent`.',
          substitutions: [
            {
              length: 43,
              offset: 120,
            },
          ],
        },
      });
    });

    it('detects a component stack in the first argument', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          {
            collapse: false,
            content: 'forEach',
            fileName: '[native code]',
            location: {column: -1, row: -1},
          },
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack for ts, tsx, jsx, and js files', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message\n    in MyTSComponent (at MyTSXComponent.ts:1)\n    in MyTSXComponent (at MyTSCComponent.tsx:1)\n    in MyJSXComponent (at MyJSXComponent.jsx:1)\n    in MyJSComponent (at MyJSComponent.js:1)',
        ]),
      ).toEqual({
        componentStackType: 'legacy',
        componentStack: [
          {
            content: 'MyTSComponent',
            fileName: 'MyTSXComponent.ts',
            location: {
              column: -1,
              row: 1,
            },
          },
          {
            content: 'MyTSXComponent',
            fileName: 'MyTSCComponent.tsx',
            location: {
              column: -1,
              row: 1,
            },
          },
          {
            content: 'MyJSXComponent',
            fileName: 'MyJSXComponent.jsx',
            location: {
              column: -1,
              row: 1,
            },
          },
          {
            content: 'MyJSComponent',
            fileName: 'MyJSComponent.js',
            location: {
              column: -1,
              row: 1,
            },
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the first argument (JSC)', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          {
            collapse: false,
            content: 'forEach',
            fileName: '[native code]',
            location: {column: -1, row: -1},
          },
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the second argument', () => {
      expect(
        parseLogBoxLog([
          'Some kind of message',
          '\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          {
            collapse: false,
            content: 'forEach',
            fileName: '[native code]',
            location: {column: -1, row: -1},
          },
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });

    it('detects a component stack in the nth argument', () => {
      expect(
        parseLogBoxLog([
          'Each child in a list should have a unique "key" prop.%s%s See https://fb.me/react-warning-keys for more information.%s',
          '\n\nCheck the render method of `MyOtherComponent`.',
          '',
          '\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        ]),
      ).toEqual({
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          {
            collapse: false,
            content: 'forEach',
            fileName: '[native code]',
            location: {column: -1, row: -1},
          },
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category:
          'Each child in a list should have a unique "key" prop.﻿%s﻿%s See https://fb.me/react-warning-keys for more information.',
        message: {
          content:
            'Each child in a list should have a unique "key" prop.\n\nCheck the render method of `MyOtherComponent`. See https://fb.me/react-warning-keys for more information.',
          substitutions: [
            {
              length: 48,
              offset: 53,
            },
            {
              length: 0,
              offset: 101,
            },
          ],
        },
      });
    });

    it('parses an error log with `error.componentStack`', () => {
      const error = {
        id: 0,
        isFatal: false,
        isComponentError: false,
        message: '### Error',
        originalMessage: '### Error',
        name: '',
        componentStack:
          '\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      };

      expect(parseLogBoxException(error)).toEqual({
        level: 'error',
        category: '### Error',
        isComponentError: false,
        message: {
          content: '### Error',
          substitutions: [],
        },
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          {
            collapse: false,
            content: 'forEach',
            fileName: '[native code]',
            location: {column: -1, row: -1},
          },
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      });
    });

    it('parses an error log with a component stack in the message', () => {
      const error = {
        id: 0,
        isFatal: false,
        isComponentError: false,
        message:
          'Some kind of message\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        originalMessage:
          'Some kind of message\nMyComponent@/path/to/filename.js:1:2\nforEach@[native code]\nMyAppComponent@/path/to/app.js:100:20',
        name: '',
        componentStackType: 'stack',
        componentStack: null,
        stack: [
          {
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
            collapse: false,
          },
        ],
      };
      expect(parseLogBoxException(error)).toEqual({
        level: 'error',
        isComponentError: false,
        stack: [
          {
            collapse: false,
            column: 1,
            file: 'foo.js',
            lineNumber: 1,
            methodName: 'bar',
          },
        ],
        componentStackType: 'stack',
        componentStack: [
          {
            collapse: false,
            content: 'MyComponent',
            fileName: '/path/to/filename.js',
            location: {column: 1, row: 1},
          },
          {
            collapse: false,
            content: 'forEach',
            fileName: '[native code]',
            location: {column: -1, row: -1},
          },
          {
            collapse: false,
            content: 'MyAppComponent',
            fileName: '/path/to/app.js',
            location: {column: 19, row: 100},
          },
        ],
        category: 'Some kind of message',
        message: {
          content: 'Some kind of message',
          substitutions: [],
        },
      });
    });
  });
});

describe('withoutANSIColorStyles', () => {
  it('works with non-strings', () => {
    expect(withoutANSIColorStyles(null)).toEqual(null);
    expect(withoutANSIColorStyles(undefined)).toEqual(undefined);
    expect(withoutANSIColorStyles({})).toEqual({});
    expect(withoutANSIColorStyles(1)).toEqual(1);
  });

  it('works with empty string', () => {
    expect(withoutANSIColorStyles('')).toEqual('');
  });

  it("doesn't modify string that don't have ANSI escape sequences", () => {
    expect(
      withoutANSIColorStyles('Warning: this is the React warning %s'),
    ).toEqual('Warning: this is the React warning %s');
  });

  it('filters out ANSI escape sequences and preserves console substitutions', () => {
    expect(
      withoutANSIColorStyles(
        '\x1b[2;38;2;124;124;124mWarning: this is the React warning %s\x1b[0m',
      ),
    ).toEqual('Warning: this is the React warning %s');
  });

  it('filters out ANSI escape sequences for string with only console substitutions', () => {
    expect(
      withoutANSIColorStyles('\x1b[2;38;2;124;124;124m%s %s\x1b[0m'),
    ).toEqual('%s %s');
  });
});

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 * @flow strict-local
 */

'use strict';

jest.mock('../../../Core/Devtools/parseErrorStack', () => {
  return {__esModule: true, default: jest.fn(() => [])};
});

const {parseLogBoxLog, parseLogBoxException} = require('../parseLogBoxLog');

describe('parseLogBoxLog', () => {
  it('parses strings', () => {
    expect(parseLogBoxLog(['A'])).toEqual({
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

  it('detects a component stack in an interpolated warning', () => {
    expect(
      parseLogBoxLog([
        'Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s%s',
        '\n\nCheck the render method of `Container(Component)`.',
        '\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
      ]),
    ).toEqual({
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
        'Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?﻿%s',
      message: {
        content:
          'Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?\n\nCheck the render method of `Container(Component)`.',
        substitutions: [
          {
            length: 52,
            offset: 129,
          },
        ],
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
      componentStack: '',
      stack: [],
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
      componentStack: '',
      stack: [],
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
      componentStack: [],
      category: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js-199-0',
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
      componentStack: '',
      stack: [],
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
      componentStack: '',
      stack: [],
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
      componentStack: '',
      stack: [],
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
      componentStack: [],
      category: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js-1-1',
    });
  });

  it('parses a error log', () => {
    const error = {
      id: 0,
      isFatal: false,
      isComponentError: false,
      message: '### Error',
      originalMessage: '### Error',
      name: '',
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

  it('parses a fatal exception', () => {
    const error = {
      id: 0,
      isFatal: true,
      isComponentError: false,
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
      isComponentError: false,
      message: {
        content: '### Fatal',
        substitutions: [],
      },
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
});

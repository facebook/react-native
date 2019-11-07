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
import type {ExceptionData} from '../../../Core/NativeExceptionsManager';

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

  it('detects a component stack in the second argument', () => {
    expect(
      parseLogBoxLog([
        'Some kind of message',
        '\n    in MyComponent (at filename.js:1)\n    in MyOtherComponent (at filename2.js:1)',
      ]),
    ).toEqual({
      componentStack: [
        {component: 'MyComponent', location: 'filename.js:1'},
        {component: 'MyOtherComponent', location: 'filename2.js:1'},
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
        {component: 'MyComponent', location: 'filename.js:1'},
        {component: 'MyOtherComponent', location: 'filename2.js:1'},
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

  it('parses a syntax error', () => {
    const error: ExceptionData = {
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
      componentStack: '',
      stack: [],
      id: 0,
      isFatal: true,
    };

    expect(parseLogBoxException(error)).toEqual({
      level: 'syntax',
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
      category: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js-199-0',
    });
  });

  it('parses a error log', () => {
    const error: ExceptionData = {
      id: 0,
      isFatal: false,
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
      message: {
        content: '### Error',
        substitutions: [],
      },
      componentStack: [
        {
          component: 'MyComponent',
          location: 'filename.js:1',
        },
        {
          component: 'MyOtherComponent',
          location: 'filename2.js:1',
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
    const error: ExceptionData = {
      id: 0,
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

  it('a malformed syntax error falls back to a fatal', () => {
    const error: ExceptionData = {
      id: 0,
      isFatal: true,
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
      level: 'fatal',
      category:
        "TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)",
      message: {
        content:
          "TransformError SyntaxError: /path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js: 'import' and 'export' may only appear at the top level (199:0)",
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
});

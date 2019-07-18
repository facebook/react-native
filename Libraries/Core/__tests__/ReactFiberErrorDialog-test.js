/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */
'use strict';

const fs = require('fs');

const capturedErrorDefaults = {
  componentName: 'A',
  componentStack: '\n  in A\n  in B\n  in C',
  errorBoundary: null,
  errorBoundaryFound: false,
  errorBoundaryName: null,
  willRetry: false,
};

describe('ReactFiberErrorDialog', () => {
  let ReactFiberErrorDialog, NativeExceptionsManager, nativeReportException;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('../NativeExceptionsManager', () => {
      return {
        default: {
          reportException: jest.fn(),
          // Used to show symbolicated messages, not part of this test.
          updateExceptionMessage: () => {},
        },
      };
    });
    // Make symbolication a no-op.
    jest.mock('../Devtools/symbolicateStackTrace', () => {
      return async function symbolicateStackTrace(stack) {
        return stack;
      };
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    ReactFiberErrorDialog = require('../ReactFiberErrorDialog');
    NativeExceptionsManager = require('../NativeExceptionsManager').default;
    nativeReportException = NativeExceptionsManager.reportException;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('showErrorDialog', () => {
    test('forwards error instance to reportException', () => {
      const error = new ReferenceError('Some error happened');
      // Copy all the data we care about before any possible mutation.
      const {message} = error;

      const logToConsoleInReact = ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error,
      });

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      const formattedMessage =
        'ReferenceError: ' +
        message +
        '\n\n' +
        'This error is located at:' +
        capturedErrorDefaults.componentStack;
      expect(exceptionData.message).toBe(formattedMessage);
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        "const error = new ReferenceError('Some error happened');",
      );
      expect(exceptionData.isFatal).toBe(false);
      expect(logToConsoleInReact).toBe(false);
      expect(console.error).toBeCalledWith(formattedMessage);
    });

    test('pops frames off the stack with framesToPop', () => {
      function createError() {
        const error = new Error('Some error happened');
        error.framesToPop = 1;
        return error;
      }
      const error = createError();

      ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error,
      });

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        'const error = createError();',
      );
    });

    test('adds the JS engine to the message', () => {
      const error = new Error('Some error happened');
      error.jsEngine = 'hermes';
      // Copy all the data we care about before any possible mutation.
      const {message, jsEngine} = error;

      ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error,
      });

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      expect(exceptionData.message).toBe(
        'Error: ' +
          message +
          '\n\n' +
          'This error is located at:' +
          capturedErrorDefaults.componentStack +
          ', js engine: ' +
          jsEngine,
      );
      expect(console.error).toBeCalledWith(
        'Error: ' +
          message +
          '\n\n' +
          'This error is located at:' +
          capturedErrorDefaults.componentStack,
        // JS engine omitted here!
      );
    });

    test('wraps string in an Error and sends to handleException', () => {
      const message = 'Some error happened';

      const logToConsoleInReact = ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error: message,
      });

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      const formattedMessage =
        message +
        '\n\n' +
        'This error is located at:' +
        capturedErrorDefaults.componentStack;
      expect(exceptionData.message).toBe(formattedMessage);
      expect(exceptionData.stack[0].file).toMatch(/ReactFiberErrorDialog\.js$/);
      expect(exceptionData.isFatal).toBe(false);
      expect(logToConsoleInReact).toBe(false);
      expect(console.error).toBeCalledWith(formattedMessage);
    });

    test('reports "Unspecified error" if error is null', () => {
      const logToConsoleInReact = ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error: null,
      });

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      const formattedMessage =
        'Unspecified error at:' + capturedErrorDefaults.componentStack;
      expect(exceptionData.message).toBe(formattedMessage);
      expect(exceptionData.stack[0].file).toMatch(/ReactFiberErrorDialog\.js$/);
      expect(exceptionData.isFatal).toBe(false);
      expect(logToConsoleInReact).toBe(false);
      expect(console.error).toBeCalledWith(formattedMessage);
    });

    test('works with a frozen error object', () => {
      const error = Object.freeze(new Error('Some error happened'));

      ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error,
      });

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        "const error = Object.freeze(new Error('Some error happened'));",
      );
    });
  });
});

const linesByFile = new Map();

function getLineFromFrame({lineNumber /* 1-based */, file}) {
  const cleanedFile = cleanFileName(file);
  const lines =
    linesByFile.get(cleanedFile) ||
    fs.readFileSync(cleanedFile, 'utf8').split('\n');
  if (!linesByFile.has(cleanedFile)) {
    linesByFile.set(cleanedFile, lines);
  }
  return (lines[lineNumber - 1] || '').trim();
}

// Works around a parseErrorStack bug involving `new X` stack frames.
function cleanFileName(file) {
  return file.replace(/^.+? \((?=\/)/, '');
}

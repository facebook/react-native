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

describe('ExceptionsManager', () => {
  let ReactFiberErrorDialog,
    ExceptionsManager,
    NativeExceptionsManager,
    nativeReportException;
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
    ExceptionsManager = require('../ExceptionsManager');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ReactFiberErrorDialog.showErrorDialog', () => {
    test('forwards error instance to reportException', () => {
      const error = new ReferenceError('Some error happened');
      // Copy all the data we care about before any possible mutation.
      const {message, name} = error;

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
      expect(exceptionData.originalMessage).toBe(message);
      expect(exceptionData.name).toBe(name);
      expect(exceptionData.componentStack).toBe(
        capturedErrorDefaults.componentStack,
      );
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
      expect(exceptionData.originalMessage).toBe(message);
      expect(exceptionData.componentStack).toBe(
        capturedErrorDefaults.componentStack,
      );
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
        'Unspecified error' +
        '\n\n' +
        'This error is located at:' +
        capturedErrorDefaults.componentStack;
      expect(exceptionData.message).toBe(formattedMessage);
      expect(exceptionData.originalMessage).toBe('Unspecified error');
      expect(exceptionData.name).toBe(null);
      expect(exceptionData.componentStack).toBe(
        capturedErrorDefaults.componentStack,
      );
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

    test('does not mutate the message', () => {
      const error = new ReferenceError('Some error happened');
      const {message} = error;

      ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error,
      });

      expect(nativeReportException).toHaveBeenCalled();
      expect(error.message).toBe(message);
    });

    test('can safely process the same error multiple times', () => {
      const error = new ReferenceError('Some error happened');
      // Copy all the data we care about before any possible mutation.
      const {message} = error;
      const componentStacks = [
        '\n  in A\n  in B\n  in C',
        '\n  in X\n  in Y\n  in Z',
      ];
      for (const componentStack of componentStacks) {
        nativeReportException.mockClear();
        const formattedMessage =
          'ReferenceError: ' +
          message +
          '\n\n' +
          'This error is located at:' +
          componentStack;
        const logToConsoleInReact = ReactFiberErrorDialog.showErrorDialog({
          ...capturedErrorDefaults,
          componentStack,
          error,
        });

        expect(nativeReportException.mock.calls.length).toBe(1);
        const exceptionData = nativeReportException.mock.calls[0][0];
        expect(exceptionData.message).toBe(formattedMessage);
        expect(exceptionData.originalMessage).toBe(message);
        expect(exceptionData.componentStack).toBe(componentStack);
        expect(getLineFromFrame(exceptionData.stack[0])).toBe(
          "const error = new ReferenceError('Some error happened');",
        );
        expect(exceptionData.isFatal).toBe(false);
        expect(logToConsoleInReact).toBe(false);
        expect(console.error).toBeCalledWith(formattedMessage);
      }
    });
  });

  describe('console.error handler', () => {
    let mockError;
    beforeEach(() => {
      // NOTE: We initialise a fresh mock every time using spyOn, above.
      // We can't use `console._errorOriginal` for this, because that's a bound
      // (=wrapped) version of the mock and Jest does not approve.
      mockError = console.error;
      ExceptionsManager.installConsoleErrorReporter();
    });

    afterEach(() => {
      // There is no uninstallConsoleErrorReporter. Do this so the next install
      // works.
      console.error = console._errorOriginal;
      delete console._errorOriginal;
      delete console.reportErrorsAsExceptions;
    });

    test('logging an Error', () => {
      const error = new Error('Some error happened');
      const {message, name} = error;

      console.error(error);

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      const formattedMessage = 'Error: ' + message;
      expect(exceptionData.message).toBe(formattedMessage);
      expect(exceptionData.originalMessage).toBe(message);
      expect(exceptionData.name).toBe(name);
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        "const error = new Error('Some error happened');",
      );
      expect(exceptionData.isFatal).toBe(false);
      expect(mockError.mock.calls[0]).toHaveLength(1);
      expect(mockError.mock.calls[0][0]).toBe(formattedMessage);
    });

    test('logging a string', () => {
      const message = 'Some error happened';

      console.error(message);

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      expect(exceptionData.message).toBe(
        'console.error: "Some error happened"',
      );
      expect(exceptionData.originalMessage).toBe('"Some error happened"');
      expect(exceptionData.name).toBe('console.error');
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        'console.error(message);',
      );
      expect(exceptionData.isFatal).toBe(false);
      expect(mockError.mock.calls[0]).toEqual([message]);
    });

    test('logging arbitrary arguments', () => {
      const args = [42, true, Symbol(), {x: undefined, y: null}];

      console.error(...args);

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      expect(exceptionData.message).toBe(
        'console.error: 42, true, ["symbol" failed to stringify], {"y":null}',
      );
      expect(exceptionData.originalMessage).toBe(
        '42, true, ["symbol" failed to stringify], {"y":null}',
      );
      expect(exceptionData.name).toBe('console.error');
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        'console.error(...args);',
      );
      expect(exceptionData.isFatal).toBe(false);

      expect(mockError).toHaveBeenCalledTimes(1);
      // Shallowly compare the mock call arguments with `args`
      expect(mockError.mock.calls[0]).toHaveLength(args.length);
      for (let i = 0; i < args.length; ++i) {
        expect(mockError.mock.calls[0][i]).toBe(args[i]);
      }
    });

    test('logging a warning', () => {
      const message = 'Warning: Some mild issue happened';

      console.error(message);

      expect(nativeReportException).not.toHaveBeenCalled();
      expect(mockError.mock.calls[0]).toEqual([message]);
    });

    test('logging a warning with more arguments', () => {
      const args = ['Warning: Some mild issue happened', 42];

      console.error(...args);

      expect(nativeReportException).not.toHaveBeenCalled();
      expect(mockError.mock.calls[0]).toEqual(args);
    });

    test('reportErrorsAsExceptions = false', () => {
      console.reportErrorsAsExceptions = false;
      const message = 'Some error happened';

      console.error(message);

      expect(nativeReportException).not.toHaveBeenCalled();
      expect(mockError.mock.calls[0]).toEqual([message]);
    });

    test('pops frames off the stack with framesToPop', () => {
      function createError() {
        const error = new Error('Some error happened');
        error.framesToPop = 1;
        return error;
      }
      const error = createError();

      console.error(error);

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        'const error = createError();',
      );
    });
  });

  describe('handleException', () => {
    test('handling a fatal Error', () => {
      const error = new Error('Some error happened');
      const {message} = error;

      ExceptionsManager.handleException(error, true);

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      const formattedMessage = 'Error: ' + message;
      expect(exceptionData.message).toBe(formattedMessage);
      expect(exceptionData.originalMessage).toBe(message);
      expect(exceptionData.name).toBe('Error');
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        "const error = new Error('Some error happened');",
      );
      expect(exceptionData.isFatal).toBe(true);
      expect(console.error.mock.calls[0]).toHaveLength(1);
      expect(console.error.mock.calls[0][0]).toBe(formattedMessage);
    });

    test('handling a non-fatal Error', () => {
      const error = new Error('Some error happened');
      const {message} = error;

      ExceptionsManager.handleException(error, false);

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      const formattedMessage = 'Error: ' + message;
      expect(exceptionData.message).toBe(formattedMessage);
      expect(exceptionData.originalMessage).toBe(message);
      expect(exceptionData.name).toBe('Error');
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        "const error = new Error('Some error happened');",
      );
      expect(exceptionData.isFatal).toBe(false);
      expect(console.error.mock.calls[0]).toHaveLength(1);
      expect(console.error.mock.calls[0][0]).toBe(formattedMessage);
    });

    test('handling a thrown string', () => {
      const message = 'Some error happened';

      ExceptionsManager.handleException(message, true);

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      expect(exceptionData.message).toBe(message);
      expect(exceptionData.originalMessage).toBe(null);
      expect(exceptionData.name).toBe(null);
      expect(exceptionData.stack[0].file).toMatch(/ExceptionsManager\.js$/);
      expect(exceptionData.isFatal).toBe(true);
      expect(console.error.mock.calls[0]).toEqual([message]);
    });

    test('pops frames off the stack with framesToPop', () => {
      function createError() {
        const error = new Error('Some error happened');
        error.framesToPop = 1;
        return error;
      }
      const error = createError();

      ExceptionsManager.handleException(error, true);

      expect(nativeReportException.mock.calls.length).toBe(1);
      const exceptionData = nativeReportException.mock.calls[0][0];
      expect(getLineFromFrame(exceptionData.stack[0])).toBe(
        'const error = createError();',
      );
    });
  });
});

const linesByFile = new Map();

function getLineFromFrame({lineNumber /* 1-based */, file}) {
  if (file == null) {
    return null;
  }
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

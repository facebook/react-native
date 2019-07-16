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

const capturedErrorDefaults = {
  componentName: 'A',
  componentStack: '\n  in A\n  in B\n  in C',
  errorBoundary: null,
  errorBoundaryFound: false,
  errorBoundaryName: null,
  willRetry: false,
};

describe('ReactFiberErrorDialog', () => {
  let ReactFiberErrorDialog, ExceptionsManager;
  beforeEach(() => {
    jest.resetModules();
    jest.mock('../ExceptionsManager', () => {
      return {
        handleException: jest.fn(),
      };
    });
    ReactFiberErrorDialog = require('../ReactFiberErrorDialog');
    ExceptionsManager = require('../ExceptionsManager');
  });

  describe('showErrorDialog', () => {
    test('forwards error instance to handleException', () => {
      const error = new ReferenceError('Some error happened');
      error.someCustomProp = 42;
      // Copy all the data we care about before any possible mutation.
      const {name, stack, message, someCustomProp} = error;

      const logToConsole = ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error,
      });

      expect(ExceptionsManager.handleException.mock.calls.length).toBe(1);
      const errorArg = ExceptionsManager.handleException.mock.calls[0][0];
      const isFatalArg = ExceptionsManager.handleException.mock.calls[0][1];
      // We intentionally don't test whether errorArg === error, because this
      // implementation detail might change. Instead, we test that they are
      // functionally equivalent.
      expect(errorArg).toBeInstanceOf(ReferenceError);
      expect(errorArg).toHaveProperty('name', name);
      expect(errorArg).toHaveProperty('stack', stack);
      expect(errorArg).toHaveProperty('someCustomProp', someCustomProp);
      expect(errorArg).toHaveProperty(
        'message',
        'ReferenceError: ' +
          message +
          '\n\n' +
          'This error is located at:' +
          capturedErrorDefaults.componentStack,
      );
      expect(isFatalArg).toBe(false);
      expect(logToConsole).toBe(false);
    });

    test('wraps string in an Error and sends to handleException', () => {
      const message = 'Some error happened';

      const logToConsole = ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error: message,
      });

      expect(ExceptionsManager.handleException.mock.calls.length).toBe(1);
      const errorArg = ExceptionsManager.handleException.mock.calls[0][0];
      const isFatalArg = ExceptionsManager.handleException.mock.calls[0][1];
      expect(errorArg).toBeInstanceOf(Error);
      expect(errorArg).toHaveProperty(
        'message',
        message +
          '\n\n' +
          'This error is located at:' +
          capturedErrorDefaults.componentStack,
      );
      expect(isFatalArg).toBe(false);
      expect(logToConsole).toBe(false);
    });

    test('reports "Unspecified error" if error is null', () => {
      const logToConsole = ReactFiberErrorDialog.showErrorDialog({
        ...capturedErrorDefaults,
        error: null,
      });

      expect(ExceptionsManager.handleException.mock.calls.length).toBe(1);
      const errorArg = ExceptionsManager.handleException.mock.calls[0][0];
      const isFatalArg = ExceptionsManager.handleException.mock.calls[0][1];
      expect(errorArg).toBeInstanceOf(Error);
      expect(errorArg).toHaveProperty(
        'message',
        'Unspecified error at:' + capturedErrorDefaults.componentStack,
      );
      expect(isFatalArg).toBe(false);
      expect(logToConsole).toBe(false);
    });
  });
});

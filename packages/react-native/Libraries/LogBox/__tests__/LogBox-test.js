/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

'use strict';

const ExceptionsManager = require('../../Core/ExceptionsManager.js');
const LogBoxData = require('../Data/LogBoxData');
const LogBox = require('../LogBox').default;

declare var console: any;

function mockFilterResult(returnValues: $FlowFixMe) {
  (LogBoxData.checkWarningFilter: any).mockReturnValue({
    finalFormat: 'Warning: ...',
    forceDialogImmediately: false,
    suppressDialog_LEGACY: false,
    suppressCompletely: false,
    monitorEvent: 'unknown',
    monitorListVersion: 0,
    monitorSampleRate: 1,
    ...returnValues,
  });
}

describe('LogBox', () => {
  const {error, warn} = console;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    LogBox.uninstall();
    // Reset ExceptionManager patching.
    if (console._errorOriginal) {
      console._errorOriginal = null;
    }
    console.error = error;
    console.warn = warn;
  });

  it('can call `ignoreAllLogs` after installing', () => {
    expect(LogBoxData.isDisabled()).toBe(false);

    LogBox.install();

    expect(LogBoxData.isDisabled()).toBe(false);

    LogBox.ignoreAllLogs(true);

    expect(LogBoxData.isDisabled()).toBe(true);
  });

  it('can call `ignoreAllLogs` before installing', () => {
    expect(LogBoxData.isDisabled()).toBe(false);

    LogBox.ignoreAllLogs(true);

    expect(LogBoxData.isDisabled()).toBe(true);

    LogBox.install();

    expect(LogBoxData.isDisabled()).toBe(true);
  });

  it('will not ignore logs for `ignoreAllLogs(false)`', () => {
    expect(LogBoxData.isDisabled()).toBe(false);

    LogBox.install();

    expect(LogBoxData.isDisabled()).toBe(false);

    LogBox.ignoreAllLogs(false);

    expect(LogBoxData.isDisabled()).toBe(false);
  });

  it('will ignore logs for `ignoreAllLogs()`', () => {
    expect(LogBoxData.isDisabled()).toBe(false);

    LogBox.install();

    expect(LogBoxData.isDisabled()).toBe(false);

    LogBox.ignoreAllLogs();

    expect(LogBoxData.isDisabled()).toBe(true);
  });

  it('registers warnings', () => {
    jest.spyOn(LogBoxData, 'addLog');

    LogBox.install();

    expect(LogBoxData.addLog).not.toBeCalled();
    console.warn('...');
    expect(LogBoxData.addLog).toBeCalled();
  });

  it('reports a LogBox exception if we fail to add warnings', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'reportLogBoxError');

    // Picking a random implementation detail to simulate throwing.
    jest.spyOn(LogBoxData, 'isMessageIgnored').mockImplementation(() => {
      throw mockError;
    });
    const mockError = new Error('Simulated error');

    LogBox.install();

    expect(LogBoxData.addLog).not.toBeCalled();
    expect(LogBoxData.reportLogBoxError).not.toBeCalled();
    console.warn('...');
    expect(LogBoxData.addLog).not.toBeCalled();
    expect(LogBoxData.reportLogBoxError).toBeCalledWith(mockError);
  });

  it('only registers errors beginning with "Warning: "', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    LogBox.install();

    console.error('...');
    expect(LogBoxData.addLog).not.toBeCalled();
    expect(LogBoxData.checkWarningFilter).not.toBeCalled();
  });

  it('registers react errors with the formatting from filter', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({
      finalFormat: 'Custom format',
    });

    LogBox.install();

    console.error(
      'Each child in a list should have a unique key %s',
      '\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({
        message: {content: 'Warning: Custom format', substitutions: []},
        category: 'Warning: Custom format',
      }),
    );
    expect(LogBoxData.checkWarningFilter).toBeCalledWith(
      'Each child in a list should have a unique key %s',
    );
  });

  it('registers errors with component stack as errors by default', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({});

    LogBox.install();

    console.error(
      'HIT %s',
      '\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'error'}),
    );
    expect(LogBoxData.checkWarningFilter).toBeCalledWith('HIT %s');
  });

  it('registers errors with component stack as errors by default if not found in warning filter', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({
      monitorEvent: 'warning_unhandled',
    });

    LogBox.install();

    console.error(
      'HIT %s',
      '\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'error'}),
    );
    expect(LogBoxData.checkWarningFilter).toBeCalledWith('HIT %s');
  });

  it('registers errors with component stack with legacy suppression as warning', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({
      suppressDialog_LEGACY: true,
      monitorEvent: 'warning',
    });

    LogBox.install();

    console.error(
      'Legacy warn %s',
      '\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'warn'}),
    );
  });

  it('registers errors with component stack and a forced dialog as fatals', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({
      forceDialogImmediately: true,
      monitorEvent: 'warning',
    });

    LogBox.install();

    console.error(
      'Fatal %s',
      '\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'fatal'}),
    );
  });

  it('registers warning module errors with the formatting from filter', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({
      finalFormat: 'Custom format',
    });

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({
        message: {content: 'Warning: Custom format', substitutions: []},
        category: 'Warning: Custom format',
      }),
    );
    expect(LogBoxData.checkWarningFilter).toBeCalledWith('...');
  });

  it('registers warning module errors as errors by default', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({});

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'error'}),
    );
    expect(LogBoxData.checkWarningFilter).toBeCalledWith('...');
  });

  it('registers warning module errors with only legacy suppression as warning', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({
      suppressDialog_LEGACY: true,
      monitorEvent: 'warning',
    });

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'warn'}),
    );
  });

  it('registers warning module errors with a forced dialog as fatals', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({
      forceDialogImmediately: true,
      monitorEvent: 'warning',
    });

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'fatal'}),
    );
  });

  it('ignores warning module errors that are suppressed completely', () => {
    jest.spyOn(LogBoxData, 'addLog');
    jest.spyOn(LogBoxData, 'checkWarningFilter');

    mockFilterResult({
      suppressCompletely: true,
      monitorEvent: 'warning',
    });

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores warning module errors that are pattern ignored', () => {
    jest.spyOn(LogBoxData, 'checkWarningFilter');
    jest.spyOn(LogBoxData, 'isMessageIgnored').mockReturnValue(true);
    jest.spyOn(LogBoxData, 'addLog');

    mockFilterResult({});

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores warning module errors that are from LogBox itself', () => {
    jest.spyOn(LogBoxData, 'checkWarningFilter');
    jest.spyOn(LogBoxData, 'isLogBoxErrorMessage').mockReturnValue(true);
    jest.spyOn(LogBoxData, 'addLog');

    mockFilterResult({});

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores logs that are pattern ignored"', () => {
    jest.spyOn(LogBoxData, 'checkWarningFilter');
    jest.spyOn(LogBoxData, 'isMessageIgnored').mockReturnValue(true);
    jest.spyOn(LogBoxData, 'addLog');

    LogBox.install();

    console.warn('ignored message');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('does not add logs that are from LogBox itself"', () => {
    jest.spyOn(LogBoxData, 'isLogBoxErrorMessage').mockReturnValue(true);
    jest.spyOn(LogBoxData, 'addLog');

    LogBox.install();

    console.warn('ignored message');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores logs starting with "(ADVICE)"', () => {
    jest.spyOn(LogBoxData, 'addLog');

    LogBox.install();

    console.warn('(ADVICE) ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('does not ignore logs formatted to start with "(ADVICE)"', () => {
    jest.spyOn(LogBoxData, 'addLog');

    LogBox.install();

    console.warn('%s ...', '(ADVICE)');
    expect(LogBoxData.addLog).toBeCalledWith({
      category: '﻿%s ...',
      componentStack: [],
      componentStackType: 'legacy',
      level: 'warn',
      message: {
        content: '(ADVICE) ...',
        substitutions: [{length: 8, offset: 0}],
      },
    });
  });

  it('ignores console methods after uninstalling', () => {
    jest.spyOn(LogBoxData, 'addLog');

    LogBox.install();
    LogBox.uninstall();

    console.log('Test');
    console.warn('Test');
    console.error('Test');

    expect(LogBoxData.addLog).not.toHaveBeenCalled();
  });

  it('does not add logs after uninstalling', () => {
    jest.spyOn(LogBoxData, 'addLog');

    LogBox.install();
    LogBox.uninstall();

    LogBox.addLog({
      level: 'warn',
      category: 'test',
      message: {content: 'Some warning', substitutions: []},
      componentStack: [],
      componentStackType: null,
    });

    expect(LogBoxData.addLog).not.toHaveBeenCalled();
  });

  it('does not add exceptions after uninstalling', () => {
    jest.spyOn(LogBoxData, 'addException');

    LogBox.install();
    LogBox.uninstall();

    LogBox.addException({
      message: 'Some error',
      originalMessage: null,
      name: 'Error',
      componentStack: null,
      stack: [],
      id: 12,
      isFatal: true,
      isComponentError: false,
    });

    expect(LogBoxData.addException).not.toHaveBeenCalled();
  });

  it('preserves decorations of console.error after installing/uninstalling', () => {
    const consoleError = console.error;

    LogBox.install();

    const originalConsoleError = console.error;
    console.error = message => {
      originalConsoleError('Custom: ' + message);
    };

    console.error('before uninstalling');

    expect(consoleError).toHaveBeenCalledWith('Custom: before uninstalling');

    LogBox.uninstall();

    console.error('after uninstalling');

    expect(consoleError).toHaveBeenCalledWith('Custom: after uninstalling');

    LogBox.install();

    console.error('after installing for the second time');

    expect(consoleError).toHaveBeenCalledWith(
      'Custom: after installing for the second time',
    );
  });

  it('preserves decorations of console.warn after installing/uninstalling', () => {
    const consoleWarn = console.warn;

    LogBox.install();

    const originalConsoleWarn = console.warn;
    console.warn = message => {
      originalConsoleWarn('Custom: ' + message);
    };

    console.warn('before uninstalling');

    expect(consoleWarn).toHaveBeenCalledWith('Custom: before uninstalling');

    LogBox.uninstall();

    console.warn('after uninstalling');

    expect(consoleWarn).toHaveBeenCalledWith('Custom: after uninstalling');

    LogBox.install();

    console.warn('after installing for the second time');

    expect(consoleWarn).toHaveBeenCalledWith(
      'Custom: after installing for the second time',
    );
  });

  it('registers errors with component stack as errors by default, when ExceptionManager is registered first', () => {
    jest.spyOn(LogBoxData, 'checkWarningFilter');
    jest.spyOn(LogBoxData, 'addLog');

    ExceptionsManager.installConsoleErrorReporter();
    LogBox.install();

    console.error(
      'HIT\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );

    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'error'}),
    );
    expect(LogBoxData.checkWarningFilter).toBeCalledWith(
      'HIT\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );
  });

  it('registers errors with component stack as errors by default, when ExceptionManager is registered second', () => {
    jest.spyOn(LogBoxData, 'checkWarningFilter');
    jest.spyOn(LogBoxData, 'addLog');

    LogBox.install();
    ExceptionsManager.installConsoleErrorReporter();

    console.error(
      'HIT\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );

    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'error'}),
    );
    expect(LogBoxData.checkWarningFilter).toBeCalledWith(
      'HIT\n    at Text (/path/to/Component:30:175)\n    at DoesNotUseKey',
    );
  });

  it('registers errors without component stack as errors by default, when ExceptionManager is registered first', () => {
    jest.spyOn(LogBoxData, 'checkWarningFilter');
    jest.spyOn(LogBoxData, 'addException');

    ExceptionsManager.installConsoleErrorReporter();
    LogBox.install();

    console.error('HIT');

    // Errors without a component stack skip the warning filter and
    // fall through to the ExceptionManager, which are then reported
    // back to LogBox as non-fatal exceptions, in a convuluted dance
    // in the most legacy cruft way.
    expect(LogBoxData.addException).toBeCalledWith(
      expect.objectContaining({originalMessage: 'HIT'}),
    );
    expect(LogBoxData.checkWarningFilter).not.toBeCalled();
  });

  it('registers errors without component stack as errors by default, when ExceptionManager is registered second', () => {
    jest.spyOn(LogBoxData, 'checkWarningFilter');
    jest.spyOn(LogBoxData, 'addException');

    LogBox.install();
    ExceptionsManager.installConsoleErrorReporter();

    console.error('HIT');

    // Errors without a component stack skip the warning filter and
    // fall through to the ExceptionManager, which are then reported
    // back to LogBox as non-fatal exceptions, in a convuluted dance
    // in the most legacy cruft way.
    expect(LogBoxData.addException).toBeCalledWith(
      expect.objectContaining({originalMessage: 'HIT'}),
    );
    expect(LogBoxData.checkWarningFilter).not.toBeCalled();
  });
});

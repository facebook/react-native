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

const LogBoxData = require('../Data/LogBoxData');
const LogBox = require('../LogBox');

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
  const {error, log, warn} = console;

  beforeEach(() => {
    jest.resetModules();
    console.error = jest.fn();
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    LogBox.uninstall();
    console.error = error;
    console.log = log;
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
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    expect(LogBoxData.addLog).not.toBeCalled();
    console.warn('...');
    expect(LogBoxData.addLog).toBeCalled();
  });

  it('reports a LogBox exception if we fail to add warnings', () => {
    jest.mock('../Data/LogBoxData');
    const mockError = new Error('Simulated error');

    // Picking a random implemention detail to simulate throwing.
    (LogBoxData.isMessageIgnored: any).mockImplementation(() => {
      throw mockError;
    });

    LogBox.install();

    expect(LogBoxData.addLog).not.toBeCalled();
    expect(LogBoxData.reportLogBoxError).not.toBeCalled();
    console.warn('...');
    expect(LogBoxData.addLog).not.toBeCalled();
    expect(LogBoxData.reportLogBoxError).toBeCalledWith(mockError);
  });

  it('only registers errors beginning with "Warning: "', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    console.error('...');
    expect(LogBoxData.addLog).not.toBeCalled();
    expect(LogBoxData.checkWarningFilter).not.toBeCalled();
  });

  it('registers warning module errors with the formatting from filter', () => {
    jest.mock('../Data/LogBoxData');

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
    jest.mock('../Data/LogBoxData');

    mockFilterResult({});

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'error'}),
    );
    expect(LogBoxData.checkWarningFilter).toBeCalledWith('...');
  });

  it('registers warning module errors with only legacy suppression as warning', () => {
    jest.mock('../Data/LogBoxData');

    mockFilterResult({
      suppressDialog_LEGACY: true,
    });

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'warn'}),
    );
  });

  it('registers warning module errors with a forced dialog as fatals', () => {
    jest.mock('../Data/LogBoxData');

    mockFilterResult({
      forceDialogImmediately: true,
    });

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).toBeCalledWith(
      expect.objectContaining({level: 'fatal'}),
    );
  });

  it('ignores warning module errors that are suppressed completely', () => {
    jest.mock('../Data/LogBoxData');

    mockFilterResult({
      suppressCompletely: true,
    });

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores warning module errors that are pattern ignored', () => {
    jest.mock('../Data/LogBoxData');

    mockFilterResult({});
    (LogBoxData.isMessageIgnored: any).mockReturnValue(true);

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores warning module errors that are from LogBox itself', () => {
    jest.mock('../Data/LogBoxData');

    mockFilterResult({});
    (LogBoxData.isLogBoxErrorMessage: any).mockReturnValue(true);

    LogBox.install();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores logs that are pattern ignored"', () => {
    jest.mock('../Data/LogBoxData');
    (LogBoxData.isMessageIgnored: any).mockReturnValue(true);

    LogBox.install();

    console.warn('ignored message');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('does not add logs that are from LogBox itself"', () => {
    jest.mock('../Data/LogBoxData');
    (LogBoxData.isLogBoxErrorMessage: any).mockReturnValue(true);

    LogBox.install();

    console.warn('ignored message');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores logs starting with "(ADVICE)"', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    console.warn('(ADVICE) ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('does not ignore logs formatted to start with "(ADVICE)"', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    console.warn('%s ...', '(ADVICE)');
    expect(LogBoxData.addLog).toBeCalledWith({
      category: '﻿%s ...',
      componentStack: [],
      level: 'warn',
      message: {
        content: '(ADVICE) ...',
        substitutions: [{length: 8, offset: 0}],
      },
    });
  });

  it('ignores console methods after uninstalling', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();
    LogBox.uninstall();

    console.log('Test');
    console.warn('Test');
    console.error('Test');

    expect(LogBoxData.addLog).not.toHaveBeenCalled();
  });

  it('does not add logs after uninstalling', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();
    LogBox.uninstall();

    LogBox.addLog({
      level: 'warn',
      category: 'test',
      message: {content: 'Some warning', substitutions: []},
      componentStack: [],
    });

    expect(LogBoxData.addLog).not.toHaveBeenCalled();
  });

  it('does not add exceptions after uninstalling', () => {
    jest.mock('../Data/LogBoxData');

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
});

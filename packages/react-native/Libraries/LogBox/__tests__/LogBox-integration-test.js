/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

const LogBoxData = require('../Data/LogBoxData');
const TestRenderer = require('react-test-renderer');

import * as React from 'react';

import {
  DoesNotUseKey,
  FragmentWithProp,
} from './__fixtures__/ReactWarningFixtures';

const installLogBox = () => {
  const LogBox = require('../LogBox');

  LogBox.install();
};

const uninstallLogBox = () => {
  const LogBox = require('../LogBox');
  LogBox.uninstall();
};

const BEFORE_SLASH_RE = /(?:\/[a-zA-Z]+\/)(.+?)(?:\/.+)\//;

const cleanPath = message => {
  return message.replace(BEFORE_SLASH_RE, '/path/to/');
};

const cleanLog = logs => {
  return logs.map(log => {
    return {
      ...log,
      componentStack: log.componentStack.map(stack => ({
        ...stack,
        fileName: cleanPath(stack.fileName),
      })),
    };
  });
};

// TODO(T71117418): Re-enable skipped LogBox integration tests once React component
// stack frames are the same internally and in open source.
// eslint-disable-next-line jest/no-disabled-tests
describe.skip('LogBox', () => {
  const {error, warn} = console;
  const mockError = jest.fn();
  const mockWarn = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();

    mockError.mockClear();
    mockWarn.mockClear();

    (console: any).error = mockError;
    (console: any).warn = mockWarn;
  });

  afterEach(() => {
    uninstallLogBox();
    (console: any).error = error;
    (console: any).warn = warn;
  });

  it('integrates with React and handles a key error in LogBox', () => {
    const spy = jest.spyOn(LogBoxData, 'addLog');
    installLogBox();

    // Spy console.error after LogBox is installed
    // so we can assert on what React logs.
    jest.spyOn(console, 'error');

    const output = TestRenderer.create(<DoesNotUseKey />);

    // The key error should always be the highest severity.
    // In LogBox, we expect these errors to:
    //   - Be added to LogBox, because all errors and warnings are.
    //   - Not call through to console.warn, because they are errors.
    //   - Pass to console.error, with a "Warning" prefix so it does not pop a RedBox.
    expect(output).toBeDefined();
    expect(mockWarn).not.toBeCalled();
    expect(console.error.mock.calls[0].map(cleanPath)).toMatchSnapshot(
      'Log sent from React',
    );
    expect(cleanLog(spy.mock.calls[0])).toMatchSnapshot('Log added to LogBox');
    expect(mockError.mock.calls[0].map(cleanPath)).toMatchSnapshot(
      'Log passed to console error',
    );
    expect(mockError.mock.calls[0][0].startsWith('Warning: ')).toBe(true);
  });

  it('integrates with React and handles a fragment warning in LogBox', () => {
    const spy = jest.spyOn(LogBoxData, 'addLog');
    installLogBox();

    // Spy console.error after LogBox is installed
    // so we can assert on what React logs.
    jest.spyOn(console, 'error');

    const output = TestRenderer.create(<FragmentWithProp />);

    // The fragment warning is not as severe. For this warning we don't want to
    // pop open a dialog, so we show a collapsed error UI.
    // That means we expect these warnings to:
    //   - Be added to LogBox and displayed collapsed as an error.
    //   - Not call console.warn, because they are errors in the console.
    //   - Pass to console.error, with a "Warning" prefix so it does not pop a RedBox.
    expect(output).toBeDefined();
    expect(mockWarn).not.toBeCalled();
    expect(console.error.mock.calls[0].map(cleanPath)).toMatchSnapshot(
      'Log sent from React',
    );
    expect(cleanLog(spy.mock.calls[0])).toMatchSnapshot('Log added to LogBox');
    expect(mockError.mock.calls[0].map(cleanPath)).toMatchSnapshot(
      'Log passed to console error',
    );
    expect(mockError.mock.calls[0][0].startsWith('Warning: ')).toBe(true);
  });
});

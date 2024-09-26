/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import {
  DoesNotUseKey,
  FragmentWithProp,
} from './__fixtures__/ReactWarningFixtures';
import * as React from 'react';

const LogBoxData = require('../Data/LogBoxData');
const TestRenderer = require('react-test-renderer');

const installLogBox = () => {
  const LogBox = require('../LogBox').default;

  LogBox.install();
};

const uninstallLogBox = () => {
  const LogBox = require('../LogBox').default;
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

// TODO: we can remove all the symetric matchers once OSS lands component stack frames.
// For now, the component stack parsing differs in ways we can't easily detect in this test.
describe('LogBox', () => {
  const {error, warn} = console;
  const mockError = jest.fn();
  const mockWarn = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

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

    let output;
    TestRenderer.act(() => {
      output = TestRenderer.create(<DoesNotUseKey />);
    });

    // The key error should always be the highest severity.
    // In LogBox, we expect these errors to:
    //   - Be added to LogBox, because all errors and warnings are.
    //   - Not call through to console.warn, because they are errors.
    //   - Pass to console.error, with a "Warning" prefix so it does not pop a RedBox.
    expect(output).toBeDefined();
    expect(mockWarn).not.toBeCalled();
    expect(console.error).toBeCalledTimes(1);
    expect(console.error.mock.calls[0].map(cleanPath)).toEqual([
      'Each child in a list should have a unique "key" prop.%s%s See https://react.dev/link/warning-keys for more information.%s',
      '\n\nCheck the render method of `DoesNotUseKey`.',
      '',
      expect.stringMatching('at DoesNotUseKey'),
    ]);
    expect(spy).toHaveBeenCalledWith({
      level: 'warn',
      category: expect.stringContaining(
        'Warning: Each child in a list should have a unique',
      ),
      componentStack: expect.anything(),
      componentStackType: 'stack',
      message: {
        content:
          'Warning: Each child in a list should have a unique "key" prop.\n\nCheck the render method of `DoesNotUseKey`. See https://react.dev/link/warning-keys for more information.',
        substitutions: [
          {length: 45, offset: 62},
          {length: 0, offset: 107},
        ],
      },
    });

    // The Warning: prefix is added due to a hack in LogBox to prevent double logging.
    // We also interpolate the string before passing to the underlying console method.
    expect(mockError.mock.calls[0]).toEqual([
      expect.stringMatching(
        'Warning: Each child in a list should have a unique "key" prop.\n\nCheck the render method of `DoesNotUseKey`. See https://react.dev/link/warning-keys for more information.\n    at ',
      ),
    ]);
  });

  it('integrates with React and handles a fragment warning in LogBox', () => {
    const spy = jest.spyOn(LogBoxData, 'addLog');
    installLogBox();

    // Spy console.error after LogBox is installed
    // so we can assert on what React logs.
    jest.spyOn(console, 'error');

    let output;
    TestRenderer.act(() => {
      output = TestRenderer.create(<FragmentWithProp />);
    });

    // The fragment warning is not as severe. For this warning we don't want to
    // pop open a dialog, so we show a collapsed error UI.
    // That means we expect these warnings to:
    //   - Be added to LogBox and displayed collapsed as an error.
    //   - Not call console.warn, because they are errors in the console.
    //   - Pass to console.error, with a "Warning" prefix so it does not pop a RedBox.
    expect(output).toBeDefined();
    expect(mockWarn).not.toBeCalled();
    expect(console.error).toBeCalledTimes(1);
    expect(console.error.mock.calls[0].map(cleanPath)).toEqual([
      'Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.%s',
      'invalid',
      expect.stringMatching('at FragmentWithProp'),
    ]);
    expect(spy).toHaveBeenCalledWith({
      level: 'warn',
      category: expect.stringContaining('Warning: Invalid prop'),
      componentStack: expect.anything(),
      componentStackType: expect.stringMatching(/(stack|legacy)/),
      message: {
        content:
          'Warning: Invalid prop `invalid` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.',
        substitutions: [{length: 7, offset: 23}],
      },
    });

    // The Warning: prefix is added due to a hack in LogBox to prevent double logging.
    // We also interpolate the string before passing to the underlying console method.
    expect(mockError.mock.calls[0]).toEqual([
      expect.stringMatching(
        'Warning: Invalid prop `invalid` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.\n    at FragmentWithProp',
      ),
    ]);
  });
});

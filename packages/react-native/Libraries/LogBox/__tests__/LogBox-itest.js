/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import 'react-native/Libraries/Core/InitializeCore';

import {renderLogBox} from './fantomHelpers';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {useEffect} from 'react';
import {LogBox, Text, View} from 'react-native';

// If a test uses this, it should have a component frame.
// This is a bug we'll fix in a followup.
const BUG_WITH_COMPONENT_FRAMES: [] = [];

// Disable the logic to make sure that LogBox is not installed in tests.
Fantom.setLogBoxCheckEnabled(false);

describe('LogBox', () => {
  let originalConsoleError;
  let originalConsoleWarn;
  let mockError;
  let mockWarn;

  beforeAll(() => {
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
  });

  beforeEach(() => {
    mockError = jest.fn((...args) => {
      originalConsoleError(...args);
    });
    mockWarn = jest.fn((...args) => {
      originalConsoleWarn(...args);
    });
    // $FlowExpectedError[cannot-write]
    console.error = mockError;
    // $FlowExpectedError[prop-missing]
    console.error.displayName = 'MockConsoleErrorForTesting';
    // $FlowExpectedError[cannot-write]
    console.warn = mockWarn;
    // $FlowExpectedError[prop-missing]
    console.warn.displayName = 'MockConsoleWarnForTesting';

    LogBox.install();
    LogBox.clearAllLogs();
    LogBox.ignoreAllLogs(false);
  });

  afterEach(() => {
    // $FlowExpectedError[cannot-write]
    console.error = originalConsoleError;
    // $FlowExpectedError[cannot-write]
    console.warn = originalConsoleWarn;
  });

  type ErrorState = {hasError: boolean};
  type ErrorProps = {children: React.Node};
  class ErrorBoundary extends React.Component<ErrorProps, ErrorState> {
    state: ErrorState = {hasError: false};

    static getDerivedStateFromError(error: Error): ErrorState {
      // Update state so the next render will show the fallback UI.
      return {hasError: true};
    }

    render(): React.Node {
      if (this.state.hasError) {
        return <Text>Error</Text>;
      }
      return this.props.children;
    }
  }

  describe('Error display and interactions', () => {
    it('does not render LogBox if there are no errors', () => {
      const logBox = renderLogBox(<View />);

      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });

    it('shows a soft error, and can dismiss the notification', () => {
      function TestComponent() {
        console.error('HIT');
      }
      const logBox = renderLogBox(<TestComponent />);

      // Console error should not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT',
      });

      // Dismiss
      logBox.dimissNotification();

      // All logs should be cleared.
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });

    it('dedupes soft errors', () => {
      function TestComponent() {
        // Important! There should be two idential logs.
        console.error('HIT');
        console.error('HIT');
      }
      const logBox = renderLogBox(<TestComponent />);

      // There should only be one notification.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT',
      });
    });

    it('show a notification, opens it, and dismisses', () => {
      function TestComponent() {
        console.error('HIT');
      }
      const logBox = renderLogBox(<TestComponent />);

      // Console error should not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT',
      });

      // Open LogBox.
      logBox.openNotification();

      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Console Error',
        message: 'HIT',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        stackFrames: ['TestComponent'],
        isDismissable: true,
      });

      // Dismiss LogBox.
      logBox.dismissInspector();

      // All logs should be cleared.
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });

    it('shows a notification, opens it, and minimizes', () => {
      function TestComponent() {
        console.error('HIT');
      }
      const logBox = renderLogBox(<TestComponent />);

      // Console error should not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT',
      });

      // Open LogBox.
      logBox.openNotification();

      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Console Error',
        message: 'HIT',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        stackFrames: ['TestComponent'],
        isDismissable: true,
      });

      // Minimize LogBox.
      logBox.mimimizeInspector();

      // Inspector should be closed, but notification is still there.
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT',
      });
    });

    it('shows multiple errors, opens, navigates, minimizes, and dismisses', () => {
      function TestComponent() {
        console.error('HIT in render');
        useEffect(() => {
          console.error('HIT in effect');
        });
      }
      const logBox = renderLogBox(<TestComponent />);

      // Console error should not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '2',
        message: 'HIT in effect',
      });

      // Open LogBox.
      logBox.openNotification();

      // Should show the most recent error.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 2 of 2',
        title: 'Console Error',
        message: 'HIT in effect',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        stackFrames: ['anonymous'],
        isDismissable: true,
      });

      // Navigate to the next error, which is 1 of 2.
      logBox.nextLog();
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 2',
        title: 'Console Error',
        message: 'HIT in render',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        stackFrames: ['TestComponent'],
        isDismissable: true,
      });

      // Navigate to the previous error, which is 2 of 2.
      logBox.nextLog();
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 2 of 2',
        title: 'Console Error',
        message: 'HIT in effect',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        stackFrames: ['anonymous'],
        isDismissable: true,
      });

      // Minimize, there should still be 2 logs.
      logBox.mimimizeInspector();
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '2',
        message: 'HIT in effect',
      });

      // Open, and dismiss one. There should still be one.
      logBox.openNotification();
      logBox.dismissInspector();
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Console Error',
        message: 'HIT in render',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        stackFrames: ['TestComponent'],
        isDismissable: true,
      });

      // Dismiss, and there should be no logs.
      logBox.dimissNotification();
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });
  });

  describe('LogBox.uninstall and LogBox.isInstalled()', () => {
    it('does not render console errors after uninstall', () => {
      function TestComponent() {
        console.error('HIT');
      }
      expect(LogBox.isInstalled()).toBe(true);

      // Uninstall and render
      LogBox.uninstall();
      expect(LogBox.isInstalled()).toBe(false);
      let logBox = renderLogBox(<TestComponent />);

      // Should be no logs.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);

      // Install and render again
      LogBox.install();
      expect(LogBox.isInstalled()).toBe(true);
      logBox = renderLogBox(<TestComponent />);

      // Should be a log.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT',
      });
    });

    it('does not render thrown errors after uninstall', () => {
      function TestComponent() {
        throw new Error('HIT');
      }
      expect(LogBox.isInstalled()).toBe(true);

      // Uninstall and render
      LogBox.uninstall();
      expect(LogBox.isInstalled()).toBe(false);
      let logBox = renderLogBox(<TestComponent />);

      // Should be no logs.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);

      // Install and render again
      LogBox.install();
      expect(LogBox.isInstalled()).toBe(true);
      logBox = renderLogBox(<TestComponent />);

      // Should pop a dialog.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Render Error',
        message: 'HIT',
        stackFrames: ['TestComponent'],
        componentStackFrames: ['<TestComponent />', '<View />', '<View />'],
        isDismissable: true,
      });

      logBox.nextLog();
    });
  });

  describe('LogBox.ignoreAllLogs', () => {
    it('ignores console errors after ignoreAllLogs', () => {
      function TestComponent() {
        console.error('HIT');
      }

      // Uninstall and render
      LogBox.ignoreAllLogs();
      let logBox = renderLogBox(<TestComponent />);

      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);

      // Reset and render again
      LogBox.ignoreAllLogs(false);
      expect(LogBox.isInstalled()).toBe(true);
      logBox = renderLogBox(<TestComponent />);
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT',
      });
    });

    it('does not ignore thrown errors after ignoreAllLogs', () => {
      function TestComponent() {
        throw new Error('HIT');
      }

      LogBox.ignoreAllLogs();
      let logBox = renderLogBox(<TestComponent />);

      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Render Error',
        message: 'HIT',
        stackFrames: ['TestComponent'],
        componentStackFrames: ['<TestComponent />', '<View />', '<View />'],
        isDismissable: true,
      });

      logBox.nextLog();
    });
  });

  describe('LogBox.ignoreLogs', () => {
    it('ignores console errors after ignoreLogs (string)', () => {
      function TestComponent() {
        console.error('HIT - should be ignored (string)');
        console.error('HIT - should be ignored (regex)');
      }

      // Ignore logs and render
      LogBox.ignoreLogs([
        'HIT - should be ignored (string)',
        /HIT - should be ignored/,
      ]);
      let logBox = renderLogBox(<TestComponent />);

      // Should be no logs.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });

    it('ignores console errors after ignoreLogs (regex)', () => {
      function TestComponent() {
        console.error('HIT - should be ignored (regex)');
      }

      // Ignore logs and render
      LogBox.ignoreLogs([/HIT - should be ignored/]);
      let logBox = renderLogBox(<TestComponent />);

      // Should be no logs.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });

    it('ignores thrown errors after ignoreLogs (string)', () => {
      function TestComponent() {
        throw new Error('THROW - should be ignored (string)');
      }

      // Ignore logs and render
      LogBox.ignoreLogs(['THROW - should be ignored (string)']);
      let logBox = renderLogBox(<TestComponent />);

      // Should be no logs.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });

    it('ignores thrown errors after ignoreLogs (regex)', () => {
      function TestComponent() {
        throw new Error('THROW - should be ignored (regex)');
      }

      // Ignore logs and render.
      LogBox.ignoreLogs([/THROW - should be ignored/]);
      let logBox = renderLogBox(<TestComponent />);

      // Should be no logs.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });
  });

  describe('LogBox.clearAllLogs', () => {
    it('clears soft errors and thrown errors after clearAllLogs', () => {
      function TestComponent() {
        console.error('HIT');
        throw new Error('THROW');
      }

      // Render with soft error and thrown error.
      const logBox = renderLogBox(<TestComponent />);

      // Should show both.
      // Note: this should only have 2 logs, but a bug renders an extra log.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getNotificationUI()).toBe(null);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 2 of 2',
        title: 'Render Error',
        message: 'THROW',
        stackFrames: ['TestComponent'],
        componentStackFrames: ['<TestComponent />', '<View />', '<View />'],
        isDismissable: true,
      });

      // Clear all logs.
      Fantom.runTask(() => {
        LogBox.clearAllLogs();
      });

      // Should be no logs.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getInspectorUI()).toBe(null);
      expect(logBox.getNotificationUI()).toBe(null);
    });
  });

  describe('LogBox.addLog and LogBox.addException', () => {
    it('adds a log an exception', () => {
      const logBox = renderLogBox(<View />);

      // Should be no logs.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toBe(null);
      expect(logBox.getInspectorUI()).toBe(null);

      // Add a log and an exception.
      Fantom.runTask(() => {
        LogBox.addLog({
          level: 'error',
          category: 'HIT',
          message: {
            content: 'HIT',
            substitutions: [],
          },
          stack: 'at TestComponent',
          componentStack: [
            {
              content: 'TestComponent',
              location: {
                row: 1,
                column: 1,
              },
              fileName: 'file.js',
              collapse: false,
            },
          ],
          componentStackType: 'stack',
        });
        LogBox.addException({
          message: 'THROW',
          originalMessage: 'THROW',
          isComponentError: false,
          name: 'Throw',
          componentStack: '    at TestComponent',
          stack: [
            {
              column: 1,
              file: 'file.js',
              lineNumber: 1,
              methodName: 'TestComponent',
              collapse: false,
            },
          ],
          id: 1,
          isFatal: false,
        });
      });

      // Should show both.
      expect(logBox.getNotificationUI()).toEqual({
        count: '2',
        message: 'THROW',
      });
    });
  });

  describe('Display for different types of errors', () => {
    it('shows a console error in render', () => {
      function TestComponent() {
        console.error('HIT in render');
      }

      const logBox = renderLogBox(<TestComponent />);

      // Console error should not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT in render',
      });

      // Open LogBox.
      logBox.openNotification();

      // Should show the error.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Console Error',
        message: 'HIT in render',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        stackFrames: ['TestComponent'],
        isDismissable: true,
      });
    });

    it('shows a soft error in an effect', () => {
      function TestComponent() {
        useEffect(() => {
          console.error('HIT in effect');
        });
      }
      const logBox = renderLogBox(<TestComponent />);

      // Console error should not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message: 'HIT in effect',
      });

      // Open LogBox.
      logBox.openNotification();

      // Should show the error.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Console Error',
        message: 'HIT in effect',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        stackFrames: ['anonymous'],
        isDismissable: true,
      });
    });

    it('shows an uncaught error in render', () => {
      function TestComponent() {
        throw new Error('THROWN in render');
      }
      const logBox = renderLogBox(<TestComponent />);

      // Uncaught errors pop a dialog.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Render Error',
        message: 'THROWN in render',
        componentStackFrames: ['<TestComponent />', '<View />', '<View />'],
        stackFrames: ['TestComponent'],
        isDismissable: true,
      });
    });

    it('shows an uncaught error in an effect', () => {
      function TestComponent() {
        useEffect(() => {
          throw new Error('THROWN in effect');
        });
      }
      const logBox = renderLogBox(<TestComponent />);

      // Uncaught errors pop a dialog.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Render Error',
        message: 'THROWN in effect',
        componentStackFrames: ['<TestComponent />', '<View />', '<View />'],
        stackFrames: ['anonymous'],
        isDismissable: true,
      });
    });

    it('shows a caught error in render', () => {
      function TestComponent() {
        throw new Error('THROWN in render');
      }
      const logBox = renderLogBox(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>,
      );

      // Caught errors pop a dialog.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Render Error',
        message: 'THROWN in render',
        componentStackFrames: [
          '<TestComponent />',
          '<ErrorBoundary />',
          '<View />',
        ],
        stackFrames: ['TestComponent'],
        isDismissable: true,
      });
    });

    it('shows a caught error in an effect', () => {
      function TestComponent() {
        useEffect(() => {
          throw new Error('THROWN in effect');
        });
      }
      const logBox = renderLogBox(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>,
      );

      // Caught errors pop a dialog.
      expect(logBox.isOpen()).toBe(true);
      expect(logBox.getInspectorUI()).toEqual({
        header: 'Log 1 of 1',
        title: 'Render Error',
        message: 'THROWN in effect',
        componentStackFrames: [
          '<TestComponent />',
          '<ErrorBoundary />',
          '<View />',
        ],
        stackFrames: ['anonymous'],
        isDismissable: true,
      });
    });

    it('shows a recoverable error in render', () => {
      let rendered = false;
      function TestComponent() {
        if (!rendered) {
          rendered = true;
          throw new Error('THROWN in render');
        }
      }
      const logBox = renderLogBox(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>,
      );

      // Recoverable errors do not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message:
          'There was an error during concurrent rendering ' +
          'but React was able to recover by instead synchronously ' +
          'rendering the entire root.',
      });

      // Open LogBox.
      logBox.openNotification();

      // Should show the error.
      expect(logBox.isOpen()).toBe(true);
      const ui = logBox.getInspectorUI();
      delete ui?.stackFrames; // too big to show
      expect(ui).toEqual({
        header: 'Log 1 of 1',
        // This seems like a bug, should be "Render Error".
        title: 'Console Error',
        message:
          'There was an error during concurrent rendering ' +
          'but React was able to recover by instead synchronously ' +
          'rendering the entire root.',
        componentStackFrames: BUG_WITH_COMPONENT_FRAMES,
        isDismissable: true,
      });
    });

    it('shows a key error (with interpolation)', () => {
      function TestComponent() {
        return [1, 2].map(i => <Text>{i}</Text>);
      }
      const logBox = renderLogBox(<TestComponent />);

      // Recoverable errors do not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message:
          'Each child in a list should have a unique "key" prop.' +
          '\n\nCheck the top-level render call using <TestComponent>. ' +
          'It was passed a child from TestComponent. ' +
          'See https://react.dev/link/warning-keys for more information.',
      });

      // Open LogBox.
      logBox.openNotification();

      // Should show the error.
      expect(logBox.isOpen()).toBe(true);
      const ui = logBox.getInspectorUI();
      delete ui?.stackFrames; // too big to show
      expect(ui).toEqual({
        header: 'Log 1 of 1',
        // This seems like a bug, should be "Render Error".
        title: 'Console Error',
        message:
          'Each child in a list should have a unique "key" prop.' +
          '\n\nCheck the top-level render call using <TestComponent>. ' +
          'It was passed a child from TestComponent. ' +
          'See https://react.dev/link/warning-keys for more information.',
        componentStackFrames: ['<anonymous />', '<TestComponent />'],
        isDismissable: true,
      });
    });

    it('shows a fragment error (with interpolation)', () => {
      function TestComponent() {
        return (
          // $FlowExpectedError[prop-missing]
          <React.Fragment invalid="foo">
            <Text>Bar</Text>
          </React.Fragment>
        );
      }
      const logBox = renderLogBox(<TestComponent />);

      // Recoverable errors do not pop a dialog.
      expect(logBox.isOpen()).toBe(false);
      expect(logBox.getNotificationUI()).toEqual({
        count: '!',
        message:
          'Invalid prop `invalid` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.',
      });

      // Open LogBox.
      logBox.openNotification();

      // Should show the error.
      expect(logBox.isOpen()).toBe(true);
      const ui = logBox.getInspectorUI();
      delete ui?.stackFrames; // too big to show
      expect(ui).toEqual({
        header: 'Log 1 of 1',
        // This seems like a bug, should be "Render Error".
        title: 'Console Error',
        message:
          'Invalid prop `invalid` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.',
        componentStackFrames: ['<TestComponent />'],
        isDismissable: true,
      });
    });
  });
});

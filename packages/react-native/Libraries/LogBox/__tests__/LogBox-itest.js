/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableAccessToHostTreeInFabric:true
 */

import View from '../../Components/View/View';
import {renderLogBox} from './fantomHelpers';
import * as React from 'react';

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
  });

  afterEach(() => {
    // $FlowExpectedError[cannot-write]
    console.error = originalConsoleError;
    // $FlowExpectedError[cannot-write]
    console.warn = originalConsoleWarn;
  });

  it('renders an empty screen if there are no errors', () => {
    const logBox = renderLogBox(<View />);

    expect(logBox.isOpen()).toBe(false);
    expect(logBox.getInspectorUI()).toBe(null);
    expect(logBox.getNotificationUI()).toBe(null);
  });

  it('handles a soft error in render, and dismisses', () => {
    function ManualConsoleErrorCall() {
      console.error('HIT');
    }
    const logBox = renderLogBox(<ManualConsoleErrorCall />);

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
      // TODO: There should be component frames for console errors.
      componentStackFrames: [],
      stackFrames: ['ManualConsoleErrorCall'],
      isDismissable: true,
    });

    // Dismiss LogBox.
    logBox.dismissInspector();

    // All logs should be cleared.
    expect(logBox.getInspectorUI()).toBe(null);
    expect(logBox.getNotificationUI()).toBe(null);
  });
});

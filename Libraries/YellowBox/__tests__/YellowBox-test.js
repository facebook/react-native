/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 * @flow
 */

'use strict';

import * as React from 'react';
const YellowBoxRegistry = require('../Data/YellowBoxRegistry');
const LogBoxData = require('../../LogBox/Data/LogBoxData');
const render = require('../../../jest/renderer');
jest.mock('../../NativeModules/specs/NativeLogBox', () => true);
jest.mock('../../LogBox/LogBoxNotificationContainer', () => ({
  __esModule: true,
  default: 'LogBoxNotificationContainer',
}));

type Overrides = {|
  forceDialogImmediately?: boolean,
  suppressDialog_LEGACY?: boolean,
  suppressCompletely?: boolean,
|};

const setFilter = (options?: Overrides) => {
  LogBoxData.setWarningFilter(format => ({
    finalFormat: format,
    forceDialogImmediately: false,
    suppressDialog_LEGACY: false,
    suppressCompletely: false,
    monitorEvent: null,
    monitorListVersion: 0,
    monitorSampleRate: 0,
    ...options,
  }));
};

const install = () => {
  const YellowBox = require('../YellowBox');
  YellowBox.install();
};

const uninstall = () => {
  const YellowBox = require('../YellowBox');
  YellowBox.uninstall();
};

describe('YellowBox', () => {
  const {error, warn} = console;
  const mockError = jest.fn();
  const mockWarn = jest.fn();

  beforeEach(() => {
    jest.resetModules();

    mockError.mockClear();
    mockWarn.mockClear();

    (console: any).error = mockError;
    (console: any).warn = mockWarn;
  });

  afterEach(() => {
    uninstall();
    (console: any).error = error;
    (console: any).warn = warn;
  });

  it('can set `disableYellowBox` after installing', () => {
    expect((console: any).disableYellowBox).toBe(undefined);

    install();

    expect((console: any).disableYellowBox).toBe(false);
    expect(YellowBoxRegistry.isDisabled()).toBe(false);

    (console: any).disableYellowBox = true;

    expect((console: any).disableYellowBox).toBe(true);
    expect(YellowBoxRegistry.isDisabled()).toBe(true);
  });

  it('can set `disableYellowBox` before installing', () => {
    expect((console: any).disableYellowBox).toBe(undefined);

    (console: any).disableYellowBox = true;
    install();

    expect((console: any).disableYellowBox).toBe(true);
    expect(YellowBoxRegistry.isDisabled()).toBe(true);
  });

  it('registers warnings', () => {
    jest.mock('../Data/YellowBoxRegistry');

    install();

    expect(YellowBoxRegistry.add).not.toBeCalled();
    (console: any).warn('...');
    expect(YellowBoxRegistry.add).toBeCalled();
    expect(mockWarn).toBeCalledTimes(1);
    expect(mockWarn).toBeCalledWith('...');
  });

  it('registers errors', () => {
    jest.mock('../Data/YellowBoxRegistry');

    install();

    (console: any).error('...');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(mockError).toBeCalledTimes(1);
    expect(mockError).toBeCalledWith('...');
  });

  it('skips ADVICE warnings', () => {
    jest.mock('../Data/YellowBoxRegistry');

    install();

    (console: any).warn('(ADVICE) Ignore me');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(mockWarn).not.toBeCalled();
  });

  it('skips ignored warnings', () => {
    jest.mock('../Data/YellowBoxRegistry');

    install();

    (YellowBoxRegistry: any).isWarningIgnored.mockReturnValue(true);
    (console: any).warn('Ignore me');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(mockWarn).not.toBeCalled();
  });

  it('registers Warning module errors with default options to YellowBox', () => {
    jest.mock('../Data/YellowBoxRegistry');

    setFilter();
    install();

    (console: any).error('Warning: ...');
    expect(YellowBoxRegistry.add).toBeCalled();
    expect(mockError).toBeCalled();
    expect(mockError).toBeCalledTimes(1);
    expect(mockWarn).not.toBeCalled();
  });

  it('skips Warning module errors with forceDialogImmediately', () => {
    jest.mock('../Data/YellowBoxRegistry');

    setFilter({
      suppressCompletely: true,
    });
    install();

    (console: any).error('Warning: ...');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(mockError).not.toBeCalled();
    expect(mockWarn).not.toBeCalled();
  });

  it('registers Warning errors with forceDialogImmediately as console.error (with interpolation)', () => {
    jest.mock('../Data/YellowBoxRegistry');

    setFilter({
      forceDialogImmediately: true,
    });

    install();

    (console: any).error('Warning: %s', 'Something');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(mockWarn).not.toBeCalled();
    expect(mockError).toBeCalledTimes(1);

    // We expect this to be the interpolated value because we don't do interpolation downstream.
    // We also strip the "Warning" prefix, otherwise the redbox would be skipped downstream.
    expect(mockError).toBeCalledWith('Something');
  });

  it('registers Warning errors with suppressDialog_LEGACY to YellowBox', () => {
    jest.mock('../Data/YellowBoxRegistry');

    setFilter({
      suppressDialog_LEGACY: true,
    });

    install();

    (console: any).error('Warning: Something');
    expect(YellowBoxRegistry.add).toBeCalledTimes(1);
    expect(mockWarn).not.toBeCalled();
    expect(mockError).toBeCalledTimes(1);

    // We cannot strip the "Warning" prefix or it would pop a redbox.
    expect(mockError).toBeCalledWith('Warning: Something');
  });

  it('skips Warning errors sent to YellowBox but ignored by patterns', () => {
    jest.mock('../Data/YellowBoxRegistry');

    setFilter({
      suppressDialog_LEGACY: true,
    });

    install();
    (YellowBoxRegistry: any).isWarningIgnored.mockReturnValue(true);

    (console: any).error('Warning: ...');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(mockWarn).not.toBeCalled();
    expect(mockError).not.toBeCalled();
  });

  it('if LogBox is enabled, installs and uninstalls LogBox', () => {
    jest.mock('../../LogBox/Data/LogBoxData');
    jest.mock('../Data/YellowBoxRegistry');
    const YellowBox = require('../YellowBox');
    YellowBox.__unstable_enableLogBox();
    install();

    (console: any).warn('Some warning');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(LogBoxData.addLog).toBeCalled();
    expect(require('../YellowBox').__unstable_isLogBoxEnabled()).toBe(true);

    uninstall();
    (LogBoxData.addLog: any).mockClear();

    (console: any).warn('Some warning');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(LogBoxData.addLog).not.toBeCalled();
    expect(YellowBox.__unstable_isLogBoxEnabled()).toBe(true);
  });

  it('throws if LogBox is enabled after YellowBox is installed', () => {
    jest.mock('../Data/YellowBoxRegistry');
    const YellowBox = require('../YellowBox');
    install();

    expect(() => YellowBox.__unstable_enableLogBox()).toThrow(
      'LogBox must be enabled before AppContainer is required so that it can properly wrap the console methods.\n\nPlease enable LogBox earlier in your app.\n\n',
    );
  });

  it('should render YellowBoxContainer by default', () => {
    const YellowBox = require('../YellowBox');

    const output = render.shallowRender(<YellowBox />);

    expect(output).toMatchSnapshot();
  });

  it('should render LogBoxNotificationContainer when LogBox is enabled', () => {
    const YellowBox = require('../YellowBox');

    YellowBox.__unstable_enableLogBox();

    const output = render.shallowRender(<YellowBox />);

    expect(output).toMatchSnapshot();
  });
});

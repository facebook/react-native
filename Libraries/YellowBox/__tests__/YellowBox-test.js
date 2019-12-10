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
const YellowBox = require('../YellowBox');
const YellowBoxRegistry = require('../Data/YellowBoxRegistry');
const LogBoxData = require('../../LogBox/Data/LogBoxData');
const render = require('../../../jest/renderer');

jest.mock('../../LogBox/LogBoxNotificationContainer', () => ({
  __esModule: true,
  default: 'LogBoxNotificationContainer',
}));

describe('YellowBox', () => {
  const {error, warn} = console;

  beforeEach(() => {
    jest.resetModules();
    (console: any).error = jest.fn();
    (console: any).warn = jest.fn();
  });

  afterEach(() => {
    YellowBox.uninstall();
    (console: any).error = error;
    (console: any).warn = warn;
  });

  it('can set `disableYellowBox` after installing', () => {
    expect((console: any).disableYellowBox).toBe(undefined);

    YellowBox.install();

    expect((console: any).disableYellowBox).toBe(false);
    expect(YellowBoxRegistry.isDisabled()).toBe(false);

    (console: any).disableYellowBox = true;

    expect((console: any).disableYellowBox).toBe(true);
    expect(YellowBoxRegistry.isDisabled()).toBe(true);
  });

  it('can set `disableYellowBox` before installing', () => {
    expect((console: any).disableYellowBox).toBe(undefined);

    (console: any).disableYellowBox = true;
    YellowBox.install();

    expect((console: any).disableYellowBox).toBe(true);
    expect(YellowBoxRegistry.isDisabled()).toBe(true);
  });

  it('registers warnings', () => {
    jest.mock('../Data/YellowBoxRegistry');

    YellowBox.install();

    expect(YellowBoxRegistry.add).not.toBeCalled();
    (console: any).warn('...');
    expect(YellowBoxRegistry.add).toBeCalled();
  });

  it('registers errors beginning with "Warning: "', () => {
    jest.mock('../Data/YellowBoxRegistry');

    YellowBox.install();

    (console: any).error('...');
    expect(YellowBoxRegistry.add).not.toBeCalled();

    (console: any).error('Warning: ...');
    expect(YellowBoxRegistry.add).toBeCalled();
  });

  it('if LogBox is enabled, installs and uninstalls LogBox', () => {
    jest.mock('../../LogBox/Data/LogBoxData');
    jest.mock('../Data/YellowBoxRegistry');

    YellowBox.__unstable_enableLogBox();
    YellowBox.install();

    (console: any).warn('Some warning');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(LogBoxData.addLog).toBeCalled();
    expect(YellowBox.__unstable_isLogBoxEnabled()).toBe(true);

    YellowBox.uninstall();
    (LogBoxData.addLog: any).mockClear();

    (console: any).warn('Some warning');
    expect(YellowBoxRegistry.add).not.toBeCalled();
    expect(LogBoxData.addLog).not.toBeCalled();
    expect(YellowBox.__unstable_isLogBoxEnabled()).toBe(true);
  });

  it('throws if LogBox is enabled after YellowBox is installed', () => {
    jest.mock('../Data/YellowBoxRegistry');

    YellowBox.install();

    expect(() => YellowBox.__unstable_enableLogBox()).toThrow(
      'LogBox must be enabled before AppContainer is required so that it can properly wrap the console methods.\n\nPlease enable LogBox earlier in your app.\n\n',
    );
  });

  it('should render YellowBoxContainer by default', () => {
    const output = render.shallowRender(<YellowBox />);

    expect(output).toMatchSnapshot();
  });

  it('should render LogBoxNotificationContainer when LogBox is enabled', () => {
    YellowBox.__unstable_enableLogBox();

    const output = render.shallowRender(<YellowBox />);

    expect(output).toMatchSnapshot();
  });
});

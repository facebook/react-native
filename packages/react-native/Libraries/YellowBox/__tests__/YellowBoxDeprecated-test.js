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

import LogBox from '../../LogBox/LogBox';

const YellowBox = require('../YellowBoxDeprecated');

describe('YellowBox', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it('calling ignoreWarnings proxies to LogBox.ignoreLogs', () => {
    jest.spyOn(LogBox, 'ignoreLogs');
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    YellowBox.ignoreWarnings(['foo']);

    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    expect(LogBox.ignoreLogs).toBeCalledWith(['foo']);
    expect(consoleWarn).toBeCalledWith(
      'YellowBox has been replaced with LogBox. Please call LogBox.ignoreLogs() instead.',
    );
  });

  it('calling install proxies to LogBox.install', () => {
    jest.spyOn(LogBox, 'install');
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    YellowBox.install();

    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    expect(LogBox.install).toBeCalled();
    expect(consoleWarn).toBeCalledWith(
      'YellowBox has been replaced with LogBox. Please call LogBox.install() instead.',
    );
  });

  it('calling uninstall proxies to LogBox.uninstall', () => {
    jest.spyOn(LogBox, 'uninstall');
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    YellowBox.uninstall();

    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    expect(LogBox.uninstall).toBeCalled();
    expect(consoleWarn).toBeCalledWith(
      'YellowBox has been replaced with LogBox. Please call LogBox.uninstall() instead.',
    );
  });
});

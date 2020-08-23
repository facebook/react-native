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

const LogBox = require('../../LogBox/LogBox');
const YellowBox = require('../YellowBoxDeprecated');

describe('YellowBox', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it('calling ignoreWarnings proxies to LogBox.ignoreLogs', () => {
    jest.spyOn(LogBox, 'ignoreLogs');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    YellowBox.ignoreWarnings(['foo']);

    expect(LogBox.ignoreLogs).toBeCalledWith(['foo']);
    expect(console.warn).toBeCalledWith(
      'YellowBox has been replaced with LogBox. Please call LogBox.ignoreLogs() instead.',
    );
  });

  it('calling install proxies to LogBox.install', () => {
    jest.spyOn(LogBox, 'install');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    YellowBox.install();

    expect(LogBox.install).toBeCalled();
    expect(console.warn).toBeCalledWith(
      'YellowBox has been replaced with LogBox. Please call LogBox.install() instead.',
    );
  });

  it('calling uninstall proxies to LogBox.uninstall', () => {
    jest.spyOn(LogBox, 'uninstall');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    YellowBox.uninstall();

    expect(LogBox.uninstall).toBeCalled();
    expect(console.warn).toBeCalledWith(
      'YellowBox has been replaced with LogBox. Please call LogBox.uninstall() instead.',
    );
  });
});

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

const YellowBox = require('../YellowBox');
const YellowBoxRegistry = require('../Data/YellowBoxRegistry');

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
});

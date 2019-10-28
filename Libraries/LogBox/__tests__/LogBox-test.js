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

const LogBox = require('../LogBox');
const LogBoxData = require('../Data/LogBoxData');

declare var console: any;

describe('LogBox', () => {
  const {error, warn} = console;

  beforeEach(() => {
    jest.resetModules();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    LogBox.uninstall();
    console.error = error;
    console.warn = warn;
  });

  it('can set `disableLogBox` after installing', () => {
    expect(console.disableLogBox).toBe(undefined);

    LogBox.install();

    expect(console.disableLogBox).toBe(false);
    expect(LogBoxData.isDisabled()).toBe(false);

    console.disableLogBox = true;

    expect(console.disableLogBox).toBe(true);
    expect(LogBoxData.isDisabled()).toBe(true);
  });

  it('can set `disableLogBox` before installing', () => {
    expect(console.disableLogBox).toBe(undefined);

    console.disableLogBox = true;
    LogBox.install();

    expect(console.disableLogBox).toBe(true);
    expect(LogBoxData.isDisabled()).toBe(true);
  });

  it('registers warnings', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    expect(LogBoxData.add).not.toBeCalled();
    console.warn('...');
    expect(LogBoxData.add).toBeCalled();
  });

  it('registers errors beginning with "Warning: " as warnings', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    console.error('...');
    expect(LogBoxData.add).toBeCalledWith('error', ['...']);

    console.error('Warning: ...');
    expect(LogBoxData.add).toBeCalledWith('warn', ['Warning: ...']);
  });
});

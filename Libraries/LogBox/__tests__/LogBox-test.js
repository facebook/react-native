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

    expect(LogBoxData.addLog).not.toBeCalled();
    console.warn('...');
    expect(LogBoxData.addLog).toBeCalled();
  });

  it('registers errors beginning with "Warning: " as warnings', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    console.error('...');
    expect(LogBoxData.addLog).not.toBeCalled();

    console.error('Warning: ...');
    expect(LogBoxData.addLog).toBeCalledWith({
      category: 'Warning: ...',
      componentStack: [],
      level: 'warn',
      message: {content: 'Warning: ...', substitutions: []},
    });
  });

  it('ignores logs that are pattern ignored"', () => {
    jest.mock('../Data/LogBoxData');
    (LogBoxData.isMessageIgnored: any).mockReturnValue(true);

    LogBox.install();

    console.warn('ignored message');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('ignores logs starting with "(ADVICE)"', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    console.warn('(ADVICE) ...');
    expect(LogBoxData.addLog).not.toBeCalled();
  });

  it('does not ignore logs formatted to start with "(ADVICE)"', () => {
    jest.mock('../Data/LogBoxData');

    LogBox.install();

    console.warn('%s ...', '(ADVICE)');
    expect(LogBoxData.addLog).toBeCalledWith({
      category: '﻿%s ...',
      componentStack: [],
      level: 'warn',
      message: {
        content: '(ADVICE) ...',
        substitutions: [{length: 8, offset: 0}],
      },
    });
  });
});

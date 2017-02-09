/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.autoMockOff();

const log = require('npmlog');
const fs = require('fs');

describe('Utils', () => {
  beforeEach(() => {
    jest.resetModules();
    delete require.cache[require.resolve('../findSymlinksPaths')];
    log.level = 'silent';
  });

  it('should read scoped packages', () => {
    const readdirSync = jest.fn()
      .mockImplementationOnce(() => [ 'module1', 'module2', '@jest', '@react' ])
      .mockImplementationOnce(() => [ 'mocks', 'tests' ])
      .mockImplementationOnce(() => [ 'native' ]);
    const lstatSync = jest.fn((str) => new fs.Stats())

    const mock = jest.setMock('fs', {
      readdirSync,
      lstatSync
    });

    const find = require('../findSymlinksPaths');
    const links = find(__dirname, []);

    expect(readdirSync.mock.calls.length).toEqual(3);
    expect(readdirSync.mock.calls[1][0]).toContain('__tests__/@jest');
    expect(readdirSync.mock.calls[2][0]).toContain('__tests__/@react');

    expect(lstatSync.mock.calls.length).toEqual(7);
    expect(lstatSync.mock.calls[2][0]).toContain('__tests__/@jest/mocks');
    expect(lstatSync.mock.calls[3][0]).toContain('__tests__/@jest/tests');
    expect(lstatSync.mock.calls[5][0]).toContain('__tests__/@react/native');
    expect(links.length).toEqual(0);
  });

  it('should attempt to read symlinks node_modules folder for nested symlinks', function () {
    const link = new fs.Stats(16777220, 41453);
    const dir = new fs.Stats(16777220, 16877);

    const readdirSync = jest.fn()
      .mockImplementationOnce(() => [ 'symlink' ])
      .mockImplementationOnce(() => [ 'deeperLink' ])
    const lstatSync = jest.fn()
      .mockImplementationOnce(str => link)
      .mockImplementationOnce(str => dir) // shortcircuits while loop
      .mockImplementationOnce(str => dir)
      .mockImplementationOnce(str => link)
      .mockImplementationOnce(str => dir) // shortcircuits while loop
      .mockImplementationOnce(str => new fs.Stats());

    const mock = jest.setMock('fs', {
      readlinkSync: str => str,
      existsSync: () => true,
      readdirSync,
      lstatSync
    });

    const find = require('../findSymlinksPaths');
    const links = find(__dirname, []);

    expect(links.length).toEqual(2);

    expect(lstatSync.mock.calls[0][0]).toContain('__tests__/symlink');
    expect(lstatSync.mock.calls[2][0]).toContain('__tests__/symlink/node_modules');
    expect(lstatSync.mock.calls[3][0]).toContain('__tests__/symlink/node_modules/deeperLink');
    expect(lstatSync.mock.calls[5][0]).toContain('__tests__/symlink/node_modules/deeperLink/node_modules');
  });
});

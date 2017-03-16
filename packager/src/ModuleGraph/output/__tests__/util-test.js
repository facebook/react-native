/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const {match} = require('sinon');
const {fn} = require('../../test-helpers');
const {
  addModuleIdsToModuleWrapper,
  createIdForPathFn,
} = require('../util');

const {any} = jasmine;

describe('`addModuleIdsToModuleWrapper`:', () => {
  const path = 'path/to/file';
  const createModule = (dependencies = []) => ({
    dependencies,
    file: {code: '__d(function(){});', isModule: true, path},
  });

  it('completes the module wrapped with module ID, and an array of dependency IDs', () => {
    const dependencies = [
      {id: 'a', path: 'path/to/a.js'},
      {id: 'b', path: 'location/of/b.js'},
    ];
    const module = createModule(dependencies);

    const idForPath = fn();
    idForPath.stub
      .withArgs(match({path})).returns(12)
      .withArgs(match({path: dependencies[0].path})).returns(345)
      .withArgs(match({path: dependencies[1].path})).returns(6);

    expect(addModuleIdsToModuleWrapper(module, idForPath))
      .toEqual('__d(function(){},12,[345,6]);');
  });

  it('omits the array of dependency IDs if it is empty', () => {
    const module = createModule();
    expect(addModuleIdsToModuleWrapper(module, () => 98))
      .toEqual(`__d(function(){},${98});`);
  });
});

describe('`createIdForPathFn`', () => {
  let idForPath;
  beforeEach(() => {
    idForPath = createIdForPathFn();
  });

  it('returns a number for a string', () => {
    expect(idForPath({path: 'arbitrary'})).toEqual(any(Number));
  });

  it('returns consecutive numbers', () => {
    const strings = [
      'arbitrary string',
      'looking/like/a/path',
      '/absolute/path/to/file.js',
      '/more files/are here',
    ];

    strings.forEach((string, i) => {
      expect(idForPath({path: string})).toEqual(i);
    });
  });

  it('returns the same id if the same string is passed in again', () => {
    const path = 'this/is/an/arbitrary/path.js';
    const id = idForPath({path});
    idForPath({path: '/other/file'});
    idForPath({path: 'and/another/file'});
    expect(idForPath({path})).toEqual(id);
  });
});

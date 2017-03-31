/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

const AssetModule = require('../AssetModule');

describe('AssetModule:', () => {
  const defaults = {file: '/arbitrary'};

  it('has no dependencies by default', () => {
    return new AssetModule(defaults).getDependencies()
      .then(deps => expect(deps).toEqual([]));
  });

  it('can be parametrized with dependencies', () => {
    const dependencies = ['arbitrary', 'dependencies'];
    return new AssetModule({...defaults, dependencies}).getDependencies()
      .then(deps => expect(deps).toEqual(dependencies));
  });
});

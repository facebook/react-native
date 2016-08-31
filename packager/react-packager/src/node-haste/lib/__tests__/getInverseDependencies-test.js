/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../getInverseDependencies');

const getInverseDependencies = require('../getInverseDependencies');

describe('getInverseDependencies', () => {
  it('', () => {
    const module1 = createModule('module1', ['module2', 'module3']);
    const module2 = createModule('module2', ['module3', 'module4']);
    const module3 = createModule('module3', ['module4']);
    const module4 = createModule('module4', []);

    const modulePairs = {
      'module1': [['module2', module2], ['module3', module3]],
      'module2': [['module3', module3], ['module4', module4]],
      'module3': [['module4', module4]],
      'module4': [],
    };

    const resolutionResponse = {
      dependencies: [module1, module2, module3, module4],
      getResolvedDependencyPairs: (module) => {
        return modulePairs[module.hash()];
      },
    };

    const dependencies = getInverseDependencies(resolutionResponse);
    const actual = // jest can't compare maps and sets
      Array.from(dependencies.entries())
        .map(([key, value]) => [key, Array.from(value)]);

    expect(actual).toEqual([
      [module2, [module1]],
      [module3, [module1, module2]],
      [module4, [module2, module3]],
    ]);
  });
});

function createModule(name, dependencies) {
  return {
    hash: () => name,
    getName: () => Promise.resolve(name),
    getDependencies: () => Promise.resolve(dependencies),
  };
}

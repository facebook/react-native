/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

describe('DeltaPatcher', () => {
  const window = (global.window = {});
  require('../DeltaPatcher');

  it('should initialize to an empty bundle', () => {
    global.Date = jest.fn();
    const dp = new window.DeltaPatcher();
    expect(dp.getLastRevisionId()).toBe(undefined);
    expect(dp.getLastModifiedDate()).toBe(global.Date.mock.instances[0]);
    expect(dp.getLastNumModifiedFiles()).toBe(0);
    // Empty pre and post.
    expect(dp.getAllModules()).toEqual(['', '']);
  });

  it('should expect a base bundle at initialization', () => {
    const dp = new window.DeltaPatcher();
    expect(() => {
      dp.applyDelta({
        base: false,
        revisionId: 'hello',
        modules: [],
        deleted: [],
      });
    }).toThrow();
  });

  it('should accept a base bundle at initialization', () => {
    const dp = new window.DeltaPatcher();
    global.Date = jest.fn();
    dp.applyDelta({
      base: true,
      revisionId: 'rev0',
      pre: 'pre0',
      post: 'post0',
      modules: [[0, '__d(0);']],
    });
    expect(dp.getLastRevisionId()).toBe('rev0');
    expect(dp.getLastModifiedDate()).toBe(global.Date.mock.instances[0]);
    expect(dp.getLastNumModifiedFiles()).toBe(1);
    expect(dp.getAllModules()).toEqual(['pre0', '__d(0);', 'post0']);
  });

  it('should accept a delta bundle after a base bundle', () => {
    const dp = new window.DeltaPatcher();
    dp.applyDelta({
      base: true,
      revisionId: 'rev0',
      pre: 'pre0',
      post: 'post0',
      modules: [[0, '__d(0);'], [1, '__d(1);'], [2, '__d(2);']],
    });
    global.Date = jest.fn();
    dp.applyDelta({
      base: false,
      revisionId: 'rev1',
      modules: [[1, '__d(1.1);'], [3, '__d(3);']],
      deleted: [0],
    });
    expect(dp.getLastRevisionId()).toBe('rev1');
    expect(dp.getLastModifiedDate()).toBe(global.Date.mock.instances[0]);
    expect(dp.getLastNumModifiedFiles()).toBe(3);
    expect(dp.getAllModules()).toEqual([
      'pre0',
      '__d(1.1);',
      '__d(2);',
      '__d(3);',
      'post0',
    ]);
  });

  it('should accept a base bundle after initialization', () => {
    const dp = new window.DeltaPatcher();
    dp.applyDelta({
      base: true,
      revisionId: 'rev0',
      pre: 'pre0',
      post: 'post0',
      modules: [[0, '__d(0);'], [1, '__d(1);'], [2, '__d(2);']],
    });
    dp.applyDelta({
      base: false,
      revisionId: 'rev1',
      modules: [[1, '__d(1.1);'], [3, '__d(3);']],
      deleted: [0],
    });
    global.Date = jest.fn();
    dp.applyDelta({
      base: true,
      revisionId: 'rev2',
      pre: 'pre2',
      post: 'post2',
      modules: [[4, '__d(4);'], [5, '__d(5);']],
    });
    expect(dp.getLastRevisionId()).toBe('rev2');
    expect(dp.getLastModifiedDate()).toBe(global.Date.mock.instances[0]);
    expect(dp.getLastNumModifiedFiles()).toBe(2);
    expect(dp.getAllModules()).toEqual(['pre2', '__d(4);', '__d(5);', 'post2']);
  });
});

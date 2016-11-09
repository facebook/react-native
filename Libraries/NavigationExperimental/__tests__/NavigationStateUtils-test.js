/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.unmock('NavigationStateUtils');

const NavigationStateUtils = require('NavigationStateUtils');

describe('NavigationStateUtils', () => {

  // Getters
  it('gets route', () => {
    const state = {index: 0, routes: [{key: 'a'}]};
    expect(NavigationStateUtils.get(state, 'a')).toEqual({key: 'a'});
    expect(NavigationStateUtils.get(state, 'b')).toBe(null);
  });

  it('gets route index', () => {
    const state = {index: 1, routes: [{key: 'a'}, {key: 'b'}]};
    expect(NavigationStateUtils.indexOf(state, 'a')).toBe(0);
    expect(NavigationStateUtils.indexOf(state, 'b')).toBe(1);
    expect(NavigationStateUtils.indexOf(state, 'c')).toBe(-1);
  });

  it('has a route', () => {
     const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
     expect(NavigationStateUtils.has(state, 'b')).toBe(true);
     expect(NavigationStateUtils.has(state, 'c')).toBe(false);
  });

  // Push
  it('pushes a route', () => {
    const state = {index: 0, routes: [{key: 'a'}]};
    const newState = {index: 1, routes: [{key: 'a'}, {key: 'b'}]};
    expect(NavigationStateUtils.push(state, {key: 'b'})).toEqual(newState);
  });

  it('does not push duplicated route', () => {
    const state = {index: 0, routes: [{key: 'a'}]};
    expect(() => NavigationStateUtils.push(state, {key: 'a'})).toThrow();
  });

  // Pop
  it('pops route', () => {
    const state = {index: 1, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 0, routes: [{key: 'a'}]};
    expect(NavigationStateUtils.pop(state)).toEqual(newState);
  });

  it('does not pop route if not applicable', () => {
    const state = {index: 0, routes: [{key: 'a'}]};
    expect(NavigationStateUtils.pop(state)).toBe(state);
  });

  // Jump
  it('jumps to new index', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 1, routes: [{key: 'a'}, {key: 'b'}]};
    expect(NavigationStateUtils.jumpToIndex(state, 0)).toBe(state);
    expect(NavigationStateUtils.jumpToIndex(state, 1)).toEqual(newState);
  });

  it('throws if jumps to invalid index', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    expect(() => NavigationStateUtils.jumpToIndex(state, 2)).toThrow();
  });

  it('jumps to new key', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 1, routes: [{key: 'a'}, {key: 'b'}]};
    expect(NavigationStateUtils.jumpTo(state, 'a')).toBe(state);
    expect(NavigationStateUtils.jumpTo(state, 'b')).toEqual(newState);
  });

  it('throws if jumps to invalid key', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    expect(() => NavigationStateUtils.jumpTo(state, 'c')).toThrow();
  });

  it('move backwards', () => {
    const state = {index: 1, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    expect(NavigationStateUtils.back(state)).toEqual(newState);
    expect(NavigationStateUtils.back(newState)).toBe(newState);
  });

  it('move forwards', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 1, routes: [{key: 'a'}, {key: 'b'}]};
    expect(NavigationStateUtils.forward(state)).toEqual(newState);
    expect(NavigationStateUtils.forward(newState)).toBe(newState);
  });

  // Replace
  it('Replaces by key', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 1, routes: [{key: 'a'}, {key: 'c'}]};
    expect(
      NavigationStateUtils.replaceAt(
        state,
        'b',
        {key: 'c'},
      )
    ).toEqual(newState);
  });

  it('Replaces by index', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 1, routes: [{key: 'a'}, {key: 'c'}]};
    expect(
      NavigationStateUtils.replaceAtIndex(
        state,
        1,
        {key: 'c'},
      )
    ).toEqual(newState);
  });

  // Reset
  it('Resets routes', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 1, routes: [{key: 'x'}, {key: 'y'}]};
    expect(
      NavigationStateUtils.reset(
        state,
        [{key: 'x'}, {key: 'y'}],
      )
    ).toEqual(newState);

    expect(() => {
      NavigationStateUtils.reset(state, []);
    }).toThrow();
  });

  it('Resets routes with index', () => {
    const state = {index: 0, routes: [{key: 'a'}, {key: 'b'}]};
    const newState = {index: 0, routes: [{key: 'x'}, {key: 'y'}]};
    expect(
      NavigationStateUtils.reset(
        state,
        [{key: 'x'}, {key: 'y'}],
        0,
      )
    ).toEqual(newState);

    expect(() => {
      NavigationStateUtils.reset(state, [{key: 'x'}, {key: 'y'}], 100);
    }).toThrow();
  });
});

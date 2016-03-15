/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow-broken
 */
'use strict';

jest
 .dontMock('NavigationFindReducer');

const NavigationFindReducer = require('NavigationFindReducer');

describe('NavigationFindReducer', () => {

  it('handles basic find reducing with strings', () => {
    let reducer = NavigationFindReducer([
      s => s,
      s => s + '_yes',
      s => 'nope',
    ]);
    let route = reducer('input');
    expect(route).toBe('input_yes');

    reducer = NavigationFindReducer([
      (s, action) => s,
      (s, action) => 'origRoute',
      (s, action) => 'firstChangedState',
    ]);
    route = reducer('origRoute', 'action1');
    expect(route).toBe('firstChangedState');

    reducer = NavigationFindReducer([
      (s, action) => s,
      (s, action) => action,
    ]);
    route = reducer('inputState', 'action2');
    expect(route).toBe('action2');
  });

});
